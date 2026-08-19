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
