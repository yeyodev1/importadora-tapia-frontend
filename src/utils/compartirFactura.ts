import { formatDate, formatMoney, formatNumFactura } from './format'
import { etiquetaEstado, tienePlazo } from './cartera'
import type { FacturaCartera } from '@/types/erp'

export function numeroFactura(f: FacturaCartera): string {
  return f.numero_factura_impreso || `${f.trc_serdoc}-${formatNumFactura(f.trc_numdoc)}`
}

/** Texto listo para WhatsApp (los *asteriscos* salen en negrita). */
export function textoFactura(f: FacturaCartera): string {
  return [
    'Hola, le saludamos de *Importadora Tapia*.',
    'Le compartimos el detalle de su factura:',
    '',
    `Cliente: ${f.per_nombre}`,
    `Factura N.º: ${numeroFactura(f)}`,
    `Emisión: ${formatDate(f.trc_fecha)}`,
    ...(tienePlazo(f) ? [`Vence: ${formatDate(f.fecha_vencimiento)}`] : []),
    `Total: ${formatMoney(f.trc_totfact)}`,
    `Abonado: ${formatMoney(f.total_abonado)}`,
    `*Saldo pendiente: ${formatMoney(f.saldo_pendiente)}*`,
    `Estado: ${etiquetaEstado(f)}`,
    '',
    'Gracias por su preferencia.',
  ].join('\n')
}

/** Sin número: WhatsApp abre la lista de contactos para elegir a quién enviar. */
export function urlWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}
