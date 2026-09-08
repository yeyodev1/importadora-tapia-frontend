import type { FacturaCartera } from '@/types/erp'

/**
 * Estado real de un documento de cartera.
 *
 * El ERP calcula estado_factura como trc_fecha + per_diascredito: para los
 * clientes SIN días de crédito configurados (per_diascredito = 0, la mayoría)
 * todo documento queda "VENCIDO" al día siguiente de emitido, lo cual no
 * refleja la realidad de Tapia. Solo se considera vencido un documento de un
 * cliente con plazo de crédito configurado (> 0 días).
 */
export type EstadoCartera = 'vencida' | 'vigente' | 'sin_plazo'

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

type FacturaPlazo = Pick<FacturaCartera, 'estado_factura' | 'per_diascredito'>

export function tienePlazo(f: FacturaPlazo): boolean {
  return Number(f.per_diascredito) > 0
}

export function estadoCartera(f: FacturaPlazo): EstadoCartera {
  if (!tienePlazo(f)) return 'sin_plazo'
  return f.estado_factura === 'VENCIDO' ? 'vencida' : 'vigente'
}

export function esVencida(f: FacturaPlazo): boolean {
  return estadoCartera(f) === 'vencida'
}

export const ESTADO_CARTERA_BADGE: Record<
  EstadoCartera,
  { tone: 'danger' | 'success' | 'info'; label: string }
> = {
  vencida: { tone: 'danger', label: 'Vencida' },
  vigente: { tone: 'success', label: 'Vigente' },
  sin_plazo: { tone: 'info', label: 'Por cobrar' },
}
