import { formatQty } from './format'

/** Línea de pedido que puede venderse en saco (cantidad y precio en la unidad del ERP, libras). */
interface LineaSaco {
  cantidad: number
  unidad?: string
  librasPorSaco?: number
}

/** Sacos de una cantidad en libras (con decimales si no es exacto). */
export const sacosDe = (it: Pick<LineaSaco, 'librasPorSaco'>, libras: number) =>
  it.librasPorSaco ? Math.round((libras / it.librasPorSaco) * 100) / 100 : 0

/** "1 saco" / "10 sacos". */
export const textoSacos = (n: number) => `${formatQty(n)} ${n === 1 ? 'saco' : 'sacos'}`

/**
 * Cantidad como la entiende bodega y el asesor: "10 sacos (550 Libras)" si sale
 * en saco, o "15 Sacos" tal cual viene del ERP. `cantidad` permite mostrar otra
 * cantidad de la misma línea (lo que falta, lo que salió…).
 */
export function cantidadTexto(it: LineaSaco, cantidad = it.cantidad): string {
  const base = `${formatQty(cantidad)} ${it.unidad || ''}`.trim()
  return it.librasPorSaco ? `${textoSacos(sacosDe(it, cantidad))} (${base})` : base
}
