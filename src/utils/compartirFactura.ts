import { formatDate, formatMoney, formatNumFactura } from './format'
import { estadoCartera, etiquetaEstado, tienePlazo, type EstadoCartera } from './cartera'
import type { FacturaCartera } from '@/types/erp'

export function numeroFactura(f: FacturaCartera): string {
  return f.numero_factura_impreso || `${f.trc_serdoc}-${formatNumFactura(f.trc_numdoc)}`
}

const EMOJI_ESTADO: Record<EstadoCartera, string> = {
  vencida: '🔴',
  vigente: '🟢',
  sin_plazo: '🟡',
  pagada: '✅',
}

/** Texto de UNA factura, listo para WhatsApp (los *asteriscos* salen en negrita). */
export function textoFactura(f: FacturaCartera): string {
  return [
    '👋 Hola, le saludamos de *Importadora Tapia*.',
    'Le compartimos el detalle de su factura:',
    '',
    `🏪 Cliente: ${f.per_nombre}`,
    `🧾 Factura N.º: ${numeroFactura(f)}`,
    `📅 Emisión: ${formatDate(f.trc_fecha)}`,
    ...(tienePlazo(f) ? [`⏳ Vence: ${formatDate(f.fecha_vencimiento)}`] : []),
    `💵 Total: ${formatMoney(f.trc_totfact)}`,
    `✅ Abonado: ${formatMoney(f.total_abonado)}`,
    `💰 *Saldo pendiente: ${formatMoney(f.saldo_pendiente)}*`,
    `${EMOJI_ESTADO[estadoCartera(f)]} Estado: ${etiquetaEstado(f)}`,
    '',
    '🙏 Gracias por su preferencia.',
  ].join('\n')
}

/** Estado de cuenta: todas las facturas pendientes del cliente y el total a pagar. */
export function textoEstadoCuenta(cliente: string, facturas: FacturaCartera[]): string {
  const total = facturas.reduce((s, f) => s + Number(f.saldo_pendiente || 0), 0)
  return [
    '👋 Hola, le saludamos de *Importadora Tapia*.',
    `📊 *Estado de cuenta de ${cliente}*`,
    '',
    ...facturas.flatMap((f) => [
      `🧾 *${numeroFactura(f)}* · 📅 ${formatDate(f.trc_fecha)}`,
      `      💰 Saldo: ${formatMoney(f.saldo_pendiente)} · ${EMOJI_ESTADO[estadoCartera(f)]} ${etiquetaEstado(f)}`,
    ]),
    '',
    `📄 Facturas pendientes: ${facturas.length}`,
    `💵 *Total por pagar: ${formatMoney(total)}*`,
    '',
    '🙏 Gracias por su preferencia.',
  ].join('\n')
}

/** Sin número: WhatsApp abre la lista de contactos para elegir a quién enviar. */
export function urlWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}
