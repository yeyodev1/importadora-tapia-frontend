import type { FacturaCartera } from '@/types/erp'

/**
 * Estado de un documento de cartera, pensado para leerse de un vistazo:
 *
 * - pagada:    saldo 0.
 * - vencida:   cliente con días de crédito y ya pasó la fecha de vencimiento.
 * - vigente:   cliente con días de crédito y aún dentro del plazo.
 * - sin_plazo: cliente sin días de crédito (la mayoría). El ERP le pone
 *              vencimiento = emisión y la marca "VENCIDO" al día siguiente,
 *              lo cual no refleja la realidad de Tapia; se muestra como
 *              "Por cobrar" con la antigüedad en días.
 */
export type EstadoCartera = 'pagada' | 'vencida' | 'vigente' | 'sin_plazo'

type FacturaPlazo = Pick<FacturaCartera, 'estado_factura' | 'per_diascredito'> &
  Partial<Pick<FacturaCartera, 'saldo_pendiente' | 'trc_fecha' | 'fecha_vencimiento'>>

/**
 * Sólo las facturas de venta (trc_tipdoc = 1) son cuentas por cobrar. La vista
 * del ERP también trae notas de crédito (4) con saldo positivo. El backend ya
 * las filtra; esto cubre una copia vieja del caché que aún no traiga el tipo.
 */
export function esFacturaVenta(f: Pick<FacturaCartera, 'trc_tipdoc' | 'descripcion_tipdoc'>): boolean {
  if (f.trc_tipdoc !== undefined && f.trc_tipdoc !== null) return String(f.trc_tipdoc) === '1'
  if (f.descripcion_tipdoc) return /factura/i.test(f.descripcion_tipdoc)
  return true
}

export function tienePlazo(f: FacturaPlazo): boolean {
  return Number(f.per_diascredito) > 0
}

export function estaPagada(f: FacturaPlazo): boolean {
  return Number(f.saldo_pendiente ?? 1) <= 0
}

/** Días transcurridos desde una fecha (0 si es hoy; negativo si es futura). */
export function diasDesde(fecha: string | null | undefined): number {
  if (!fecha) return 0
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return 0
  const hoy = new Date()
  const utcHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const utcFecha = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.round((utcHoy - utcFecha) / 86_400_000)
}

export function estadoCartera(f: FacturaPlazo): EstadoCartera {
  if (estaPagada(f)) return 'pagada'
  if (!tienePlazo(f)) return 'sin_plazo'
  return f.estado_factura === 'VENCIDO' ? 'vencida' : 'vigente'
}

export function esVencida(f: FacturaPlazo): boolean {
  return estadoCartera(f) === 'vencida'
}

export const ESTADO_CARTERA_BADGE: Record<
  EstadoCartera,
  { tone: 'danger' | 'success' | 'info' | 'neutral'; label: string }
> = {
  pagada: { tone: 'neutral', label: 'Pagada' },
  vencida: { tone: 'danger', label: 'Vencida' },
  vigente: { tone: 'success', label: 'Vigente' },
  sin_plazo: { tone: 'info', label: 'Por cobrar' },
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`
}

/**
 * Etiqueta completa del estado con el dato que lo explica:
 *   "Pagada" · "Por cobrar · 45 días" · "Vencida · hace 12 días" · "Vigente · vence en 8 días".
 */
export function etiquetaEstado(f: FacturaPlazo): string {
  const estado = estadoCartera(f)
  if (estado === 'pagada') return 'Pagada'
  if (estado === 'sin_plazo') {
    const dias = diasDesde(f.trc_fecha)
    return dias <= 0 ? 'Por cobrar · emitida hoy' : `Por cobrar · ${plural(dias, 'día', 'días')}`
  }
  const dias = diasDesde(f.fecha_vencimiento)
  if (estado === 'vencida') return dias <= 0 ? 'Vencida hoy' : `Vencida · hace ${plural(dias, 'día', 'días')}`
  const faltan = -dias
  return faltan <= 0 ? 'Vigente · vence hoy' : `Vigente · vence en ${plural(faltan, 'día', 'días')}`
}

/** "hace 363 días" / "hoy" — para acompañar una fecha y que no parezca futura. */
export function haceDias(fecha: string | null | undefined): string {
  const dias = diasDesde(fecha)
  if (dias <= 0) return 'hoy'
  return `hace ${plural(dias, 'día', 'días')}`
}
