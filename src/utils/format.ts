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
 * Número de factura como lo imprime el ERP de Tapia: mínimo 4 cifras con
 * ceros a la izquierda (trc_numdoc es numérico y los pierde): 420 -> "0420".
 */
export function formatNumFactura(value: string | number | null | undefined): string {
  const s = String(value ?? '').trim()
  return s ? s.padStart(4, '0') : '—'
}

/** Iniciales para avatares: "LOPEZ CARDENAS VICTOR" -> "LC" */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}
