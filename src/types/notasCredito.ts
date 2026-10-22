export type EstadoNotaCredito = 'pendiente' | 'aprobada' | 'rechazada'
export type MotivoNotaCredito = 'precio' | 'calidad' | 'otro'

/** Solicitud de nota de crédito del asesor; la aprueba administración. */
export interface NotaCredito {
  _id: string
  numero: string
  vendedorId: string
  vendedorNombre: string
  venCodigo?: string
  clienteCodigo: string
  clienteNombre: string
  motivo: MotivoNotaCredito
  comentario: string
  estado: EstadoNotaCredito
  motivoRechazo?: string
  revisadoPor?: string
  revisadoAt?: string
  createdAt: string
  updatedAt: string
}

export const MOTIVO_NOTA_LABEL: Record<MotivoNotaCredito, string> = {
  precio: 'Precio · competencia más barata',
  calidad: 'Calidad del producto',
  otro: 'Otro motivo',
}

export const ESTADO_NOTA_LABEL: Record<EstadoNotaCredito, string> = {
  pendiente: 'Por aprobar',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export const ESTADO_NOTA_TONE: Record<EstadoNotaCredito, 'warning' | 'success' | 'danger'> = {
  pendiente: 'warning',
  aprobada: 'success',
  rechazada: 'danger',
}
