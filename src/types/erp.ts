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

export interface ReservaPedido {
  id: string
  numero: string
  estado: EstadoPedido
  clienteNombre: string
  cantidad: number
  /** Ya marcada facturada o salida, pero el ERP aún no baja ese stock. */
  pendienteErp?: boolean
}

export interface InventarioItem {
  pro_codigo: string
  pro_nombre: string
  uni_nombre: string
  bod_codigo: string
  bod_nombre: string
  stock_actual: string
  /** Apartado por pedidos que el ERP aún no descuenta (sin facturar). */
  reservado?: number
  /** stock_actual - reservado: lo que de verdad se puede vender. */
  disponible?: number
  /** Solo administración: qué OP sin facturar apartan este stock. */
  reservadoPor?: ReservaPedido[]
  /** Regla del admin: el producto sólo se vende al contado. */
  solo_contado?: boolean
  /** Regla del admin: se vende por libra pero sale en saco de estas libras (null = suelto). */
  libras_por_saco?: number | null
}

export interface ReglaProducto {
  proCodigo: string
  proNombre: string
  soloContado: boolean
  librasPorSaco?: number | null
  actualizadoPor?: string
  updatedAt?: string
}

/** Lo vendido por un asesor (pedidos sin aprobación, en espera y aprobados). */
export interface VentasAsesor {
  vendedorId: string
  venCodigo: string | null
  nombre: string
  total: number
  productos: {
    productoCodigo: string
    productoNombre: string
    unidad?: string
    cantidad: number
    aprobada: number
    pendiente: number
    total: number
    pedidos: number
  }[]
}

/** Cupo por asesor de un producto escaso; `usado` cuenta lo pedido desde `desde`. */
export interface CupoProducto {
  proCodigo: string
  proNombre: string
  desde: string
  cupos: { venCodigo: string; nombre?: string; cantidad: number; usado: number; queda: number }[]
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
  /** Bodega (bod_nombre) de la que vende; null = sin asignar (no puede enviar pedidos). */
  bodega?: string | null
  actualizadoPor?: string
  updatedAt?: string
}

export interface ErpListResponse<T> {
  success: boolean
  data: T[]
}

export type UserRole = 'admin' | 'vendedor' | 'bodega'

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
  /** Funciones que el admin le suma al rol (hoy: vendedor que también despacha en bodega). */
  rolesExtra?: UserRole[]
  venCodigo: string | null
  /** Quien despacha (rol bodega o vendedor con bodega): bod_nombre al que se limita (vacío = todas). */
  bodega?: string
  /** El admin pidió que ponga su propio correo; la app no deja seguir hasta cambiarlo. */
  debeCambiarCorreo?: boolean
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

/**
 * enviado = sin aprobación; en_espera = stand-by con mensaje de administración al asesor;
 * anulado = se cayó después de enviado o aprobado (libera stock y cupo, no se despacha).
 * rechazado_cliente = estaba aprobado y el cliente no lo recibió (la mercadería regresa).
 */
export type EstadoPedido = 'enviado' | 'aprobado' | 'rechazado' | 'en_espera' | 'anulado' | 'rechazado_cliente'

export interface EntregaPedido {
  at: string
  por: string
  cantidades: { productoCodigo: string; bodega?: string; cantidad: number }[]
  fotos: string[]
  observacion?: string
}

/** Administración bajó cantidades o quitó líneas de un pedido que aún no sale. */
export interface AjustePedido {
  at: string
  por: string
  nota?: string
  cambios: { productoNombre: string; antes: number; despues: number }[]
}

/** Cada decisión de administración sobre el pedido (aprobar, poner en espera, rechazar). */
export interface CambioEstadoPedido {
  estado: EstadoPedido
  nota?: string
  por: string
  at: string
}

export interface PedidoItem {
  productoCodigo: string
  productoNombre: string
  unidad?: string
  bodega?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  /** Sale en saco: libras de cada saco. `cantidad` y `precioUnitario` siguen en libras. */
  librasPorSaco?: number
}

export interface Pedido {
  _id: string
  numero: string
  vendedorId?: string
  vendedorNombre: string
  clienteNombre: string
  clienteCodigo?: string
  items: PedidoItem[]
  total: number
  /** Plazo de crédito en días (0 = contado). Pedidos viejos pueden no traerlo. */
  plazoCreditoDias?: number
  fotoUrl?: string
  /** Todas las fotos de la orden de pedido (fotoUrl es la primera). */
  fotos?: string[]
  /** Salida de bodega (hora del servidor, fotos y quién la marcó). */
  despacho?: { salidaAt: string; fotos: string[]; observacion?: string; despachadoPor: string }
  /** Salidas de bodega cuando el cliente recibe por partes; la que completa el pedido llena `despacho`. */
  entregas?: EntregaPedido[]
  /** Retrasos del despacho; el último es el vigente. nuevaFecha = "YYYY-MM-DD". */
  retrasos?: { registradoAt: string; nuevaFecha: string; motivo: string; registradoPor: string }[]
  updatedAt?: string
  observacion?: string
  motivoRechazo?: string
  /** Comentario opcional de administración al aprobar (ej. "Transferencia OK"). */
  comentarioAprobacion?: string
  /** Mensaje al asesor mientras el pedido está en espera. */
  motivoEspera?: string
  historialEstado?: CambioEstadoPedido[]
  /** Quién anuló el pedido (admin o su vendedor), por qué y cuándo. */
  anulacion?: { motivo: string; por: string; rol: string; at: string }
  /** El cliente no recibió el pedido; yaHabiaSalido = la mercadería ya había salido de bodega y regresa. */
  rechazoCliente?: { motivo: string; por: string; rol: string; at: string; yaHabiaSalido: boolean }
  ajustes?: AjustePedido[]
  /** Administración ya lo facturó en el ERP: desde ahí deja de reservar stock. */
  facturacion?: { at: string; por: string; numeroFactura?: string }
  estado: EstadoPedido
  createdAt: string
}

export interface NuevoPedido {
  clienteNombre: string
  clienteCodigo?: string
  plazoCreditoDias: number
  /** `sacos`: el asesor pidió en saco; el servidor calcula las libras con su regla. */
  items: (Omit<PedidoItem, 'subtotal' | 'librasPorSaco'> & { sacos?: number })[]
  /** Fotos de la orden de pedido (OP) ya subidas a Cloudinary. */
  fotos?: string[]
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
    rolesExtra?: UserRole[]
    venCodigo: string | null
    bodega?: string
    debeCambiarCorreo?: boolean
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
