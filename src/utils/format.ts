const money = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const integer = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 0 })

const decimal = new Intl.NumberFormat('es-EC', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatMoney(value: string | number | null | undefined): string {
  const n = Number(value)
  return Number.isFinite(n) ? money.format(n) : '—'
}

export function formatInt(value: string | number | null | undefined): string {
  const n = Number(value)
  return Number.isFinite(n) ? integer.format(n) : '—'
}

export function formatQty(value: string | number | null | undefined): string {
  const n = Number(value)
  return Number.isFinite(n) ? decimal.format(n) : '—'
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/**
 * Número de factura como lo imprime el sistema de Tapia (reporte "Cuentas por
 * cobrar"): el número tal cual, sin ceros a la izquierda (7892, 6075, 12497).
 */
export function formatNumFactura(value: string | number | null | undefined): string {
  const s = String(value ?? '').trim()
  return s || '—'
}

/** Iniciales para avatares: "LOPEZ CARDENAS VICTOR" -> "LC" */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

/** Plazo de crédito de un pedido: "Contado", "30 días" o "—" si no se registró. */
export function formatPlazo(dias: number | null | undefined): string {
  if (dias === null || dias === undefined) return '—'
  if (Number(dias) === 0) return 'Contado'
  return `${dias} días`
}
