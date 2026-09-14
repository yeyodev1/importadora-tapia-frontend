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

/** in_trancab.trc_tipdoc: 1 = Factura ventas, 4 = Nota de Crédito ventas. */
export type TipoDocumentoErp = '1' | '4' | string

export interface FacturaCartera {
  per_nombre: string
  per_diascredito: number
  trc_codigo: string
  /** Tipo de documento del ERP (desde la vista del 24-ago-2026). */
  trc_tipdoc?: TipoDocumentoErp
  descripcion_tipdoc?: string
  trc_serdoc: string
  trc_numdoc: string
  /** "301999-6075": serie y número como los imprime el sistema de Tapia. */
  numero_factura_impreso?: string
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
  /** Regla del admin: el producto sólo se vende al contado. */
  solo_contado?: boolean
}

export interface ReglaProducto {
  proCodigo: string
  proNombre: string
  soloContado: boolean
  actualizadoPor?: string
  updatedAt?: string
}

export interface InventarioDisponible extends InventarioItem {
  reservado: number
  disponible: number
}

/** Qué parte del inventario ve un vendedor (lo asigna el admin). */
export interface AsignacionInventario {
  venCodigo: string
  restringido: boolean
  productos: string[]
  actualizadoPor?: string
  updatedAt?: string
}

export interface ErpListResponse<T> {
  success: boolean
  data: T[]
}

export type UserRole = 'admin' | 'vendedor'

/** Vendedor del ERP que ya no trabaja con Tapia: se oculta en la app. */
export interface VendedorOculto {
  venCodigo: string
  venNombre: string
  motivo: string
  ocultadoPor: string
  createdAt: string
}

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
  /** Plazo de crédito en días (0 = contado). Pedidos viejos pueden no traerlo. */
  plazoCreditoDias?: number
  fotoUrl?: string
  observacion?: string
  motivoRechazo?: string
  estado: EstadoPedido
  createdAt: string
}

export interface NuevoPedido {
  clienteNombre: string
  clienteCodigo?: string
  plazoCreditoDias: number
  items: Omit<PedidoItem, 'subtotal'>[]
  foto?: string
  observacion?: string
}

export type EstadoVisita = 'en_curso' | 'finalizada'
export type ResultadoVisita = 'atendido' | 'espera' | 'regreso' | 'abandono'

export interface GeoPunto {
  lat: number
  lng: number
  ts: string
}

export interface Visita {
  _id: string
  vendedorNombre: string
  clienteNombre?: string
  clienteCodigo?: string
  entrada: GeoPunto
  salida?: GeoPunto
  duracionMin?: number
  estado: EstadoVisita
  resultado?: ResultadoVisita
  observacion?: string
  createdAt: string
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

/** Foto o PDF de la factura física, ligada a una factura del ERP (trc_codigo). */
export interface FacturaAdjunto {
  _id: string
  trcCodigo: string
  numeroFactura: string
  clienteNombre: string
  url: string
  nombre: string
  formato: 'imagen' | 'pdf'
  bytes: number
  subidoPor: string
  subidoPorId: string
  createdAt: string
}
