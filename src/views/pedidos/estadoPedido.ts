import type { EstadoPedido, Pedido } from '@/types/erp'

/** Etiquetas y tonos de cada estado del pedido: una sola fuente para lista, filtros y detalle. */
export type TonoEstado = 'info' | 'success' | 'danger' | 'warning'

export const LABEL_ESTADO: Record<EstadoPedido, string> = {
  enviado: 'Sin aprobación',
  en_espera: 'En espera',
  aprobado: 'Aprobado',
  rechazado: 'No aprobado',
}

export const TONO_ESTADO: Record<EstadoPedido, TonoEstado> = {
  enviado: 'info',
  en_espera: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

/** Estados en los que administración todavía puede decidir. */
export const esDecidible = (p: Pedido) => p.estado === 'enviado' || p.estado === 'en_espera'

/** Hora corta para el historial: "06 oct, 10:42". */
export const horaCorta = (iso: string) =>
  new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
