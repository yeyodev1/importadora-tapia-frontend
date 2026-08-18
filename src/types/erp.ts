export interface Cliente {
  per_codigo: string
  per_nombre: string
  per_direccion: string
  per_identificacion: string
  per_telefono: string
  per_email: string
  ven_nombre: string
  ven_codigo: string
}

export interface Vendedor {
  ven_codigo: string
  ven_nombre: string
}

export type EstadoFactura = 'VIGENTE' | 'VENCIDO' | string

export interface FacturaCartera {
  per_nombre: string
  per_diascredito: number
  trc_codigo: string
  trc_serdoc: string
  trc_numdoc: string
  trc_totfact: string
  trc_fecha: string
  fecha_vencimiento: string
  total_abonado: string
  saldo_pendiente: string
  estado_factura: EstadoFactura
}

export interface CarteraConsolidada {
  per_codigo: string
  per_nombre: string
  deuda_total: string
}

export interface InventarioItem {
  pro_codigo: string
  pro_nombre: string
  uni_nombre: string
  bod_codigo: string
  bod_nombre: string
  stock_actual: string
}

export interface InventarioDisponible extends InventarioItem {
  reservado: number
  disponible: number
}

export interface ErpListResponse<T> {
  success: boolean
  data: T[]
}

export type UserRole = 'admin' | 'vendedor'

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
  venCodigo: string | null
  createdAt?: string
}

export type MetodoPago = 'efectivo' | 'transferencia' | 'cheque' | 'deposito'
export type EstadoCobro = 'registrado' | 'aplicado' | 'rechazado'

export interface Cobro {
  _id: string
  numero: string
  vendedorNombre: string
  venCodigo?: string
  clienteNombre: string
  clienteCodigo?: string
  facturaRef?: string
  monto: number
  metodoPago: MetodoPago
  comprobanteUrl: string
  firmaUrl?: string
  observacion?: string
  estado: EstadoCobro
  createdAt: string
}

export interface NuevoCobro {
  clienteNombre: string
  clienteCodigo?: string
  facturaRef?: string
  monto: number
  metodoPago: MetodoPago
  comprobante: string
  firma?: string
  observacion?: string
}

export type EstadoPedido = 'enviado' | 'aprobado' | 'rechazado'

export interface PedidoItem {
  productoCodigo: string
  productoNombre: string
  unidad?: string
  bodega?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Pedido {
  _id: string
  numero: string
  vendedorNombre: string
  clienteNombre: string
  clienteCodigo?: string
  items: PedidoItem[]
  total: number
  observacion?: string
  motivoRechazo?: string
  estado: EstadoPedido
  createdAt: string
}

export interface NuevoPedido {
  clienteNombre: string
  clienteCodigo?: string
  items: Omit<PedidoItem, 'subtotal'>[]
  observacion?: string
}

export interface EstadoErp {
  success: boolean
  conectado: boolean
  latenciaMs: number | null
  motivo: string | null
  detalle: string | null
  ultimaSincronizacion: string | null
  copias: { vista: string; registros: number; actualizado: string }[]
}

export interface LoginResponse {
  success: boolean
  token: string
  user: {
    id: string
    email: string
    name: string
    role: UserRole
    venCodigo: string | null
  }
}
