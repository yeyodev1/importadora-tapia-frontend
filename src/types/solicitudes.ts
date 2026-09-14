export type TipoSolicitud = 'nuevo' | 'actualizacion'
export type TipoPersona = 'natural' | 'obligado' | 'juridica'
export type EstadoSolicitud = 'borrador' | 'enviada' | 'aprobada' | 'rechazada'
export type TipoDocumento =
  | 'solicitud_firmada'
  | 'cedula'
  | 'servicio_basico'
  | 'factura_proveedor'
  | 'ruc'
  | 'nombramiento'

export interface DocumentoSolicitud {
  tipo: TipoDocumento
  url: string
  nombre: string
  formato: string
  bytes: number
}

export interface RefComercial {
  proveedor: string
  montoMes: string
  plazoPago: string
  telefono: string
}
export interface RefBancaria {
  banco: string
  cuenta: string
}
export interface RefPersonal {
  nombres: string
  apellidos: string
  parentesco: string
  telefonos: string
}

/** Lo que llena el vendedor (igual a la hoja "Solicitud de crédito / actualización de datos"). */
export interface SolicitudDatos {
  tipo: TipoSolicitud
  tipoPersona: TipoPersona
  titular: { nombres: string; apellidos: string; cedula: string; formaPago: string }
  negocio: {
    nombre: string
    ruc: string
    direccion: string
    telefono: string
    celular: string
    direccionDomicilio: string
    telefonoDomicilio: string
  }
  refComerciales: RefComercial[]
  refBancarias: RefBancaria[]
  refPersonales: RefPersonal[]
  autorizaBuro: boolean
  documentos: DocumentoSolicitud[]
  observacion?: string
  clienteCodigo?: string
  clienteNombre?: string
}

export interface SolicitudCredito extends SolicitudDatos {
  _id: string
  numero: string
  vendedorNombre: string
  venCodigo?: string
  estado: EstadoSolicitud
  enviadaAt?: string
  motivoRechazo?: string
  revisadoPor?: string
  revisadoAt?: string
  vinculadoPor?: string
  vinculadoAt?: string
  createdAt: string
  updatedAt: string
}

export interface FirmaSubida {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
}
