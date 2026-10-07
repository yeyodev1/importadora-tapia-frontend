import type { Pedido, PedidoItem } from '@/types/erp'

/** Clave de una línea para cruzar con las entregas (igual que en el backend). */
const clave = (it: { productoCodigo: string; bodega?: string }) => `${it.productoCodigo}|${it.bodega || ''}`

/** Por cada línea del pedido: cuánto pidió, cuánto ya salió y cuánto falta. */
export function avanceEntregas(p: Pedido): { it: PedidoItem; salio: number; falta: number }[] {
  const m: Record<string, number> = {}
  for (const e of p.entregas || []) for (const c of e.cantidades) m[clave(c)] = (m[clave(c)] || 0) + c.cantidad
  return p.items.map((it) => {
    const salio = m[clave(it)] || 0
    return { it, salio, falta: Math.max(0, it.cantidad - salio) }
  })
}

/** El pedido ya tiene salidas parciales pero aún falta entregar. */
export const esEntregaParcial = (p: Pedido) => !p.despacho?.salidaAt && !!p.entregas?.length
