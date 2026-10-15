import type { EstadoPedido, Pedido } from '@/types/erp'

/** Etiquetas y tonos de cada estado del pedido: una sola fuente para lista, filtros y detalle. */
export type TonoEstado = 'info' | 'success' | 'danger' | 'warning'

export const LABEL_ESTADO: Record<EstadoPedido, string> = {
  enviado: 'Sin aprobación',
  en_espera: 'En espera',
  aprobado: 'Aprobado',
  rechazado: 'No aprobado',
  anulado: 'Anulado',
  rechazado_cliente: 'Rechazado por el cliente',
}

export const TONO_ESTADO: Record<EstadoPedido, TonoEstado> = {
  enviado: 'info',
  en_espera: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
  anulado: 'danger',
  rechazado_cliente: 'danger',
}

/** Estados en los que administración todavía puede decidir. */
export const esDecidible = (p: Pedido) => p.estado === 'enviado' || p.estado === 'en_espera'

/** Pedido vivo que aún no sale de bodega: se puede anular o bajarle cantidades. */
export const esModificable = (p: Pedido) =>
  !p.despacho?.salidaAt && p.estado !== 'rechazado' && p.estado !== 'anulado' && p.estado !== 'rechazado_cliente'

/** Pedido aprobado (haya salido o no de bodega) que el cliente puede no recibir. */
export const puedeRechazoCliente = (p: Pedido) => p.estado === 'aprobado'

/** Aprobado que el ERP aún no descuenta (sin facturar ni salir de bodega): aparta su stock. */
export const porFacturar = (p: Pedido) =>
  p.estado === 'aprobado' && !p.facturacion && !p.despacho?.salidaAt && !p.entregas?.length

/** Hora corta para el historial: "06 oct, 10:42". */
export const horaCorta = (iso: string) =>
  new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
