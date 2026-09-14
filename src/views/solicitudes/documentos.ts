import type { EstadoSolicitud, SolicitudDatos, TipoDocumento, TipoPersona } from '@/types/solicitudes'

export interface DefDocumento {
  tipo: TipoDocumento
  label: string
  ayuda: string
}

/** Los 6 documentos de la hoja, en el mismo orden. */
export const DOCUMENTOS: DefDocumento[] = [
  { tipo: 'solicitud_firmada', label: 'Solicitud de crédito llena y firmada', ayuda: 'Foto o PDF de la hoja firmada por el cliente.' },
  { tipo: 'cedula', label: 'Copia legible de la cédula', ayuda: 'Ambos lados, que se lean los datos.' },
  { tipo: 'servicio_basico', label: 'Planilla actual de servicio básico', ayuda: 'Luz, agua o teléfono del último mes.' },
  { tipo: 'factura_proveedor', label: 'Facturas actuales de proveedores', ayuda: 'Mínimo dos facturas de compras a crédito.' },
  { tipo: 'ruc', label: 'Copia del RUC actualizado', ayuda: 'Personas jurídicas o negocios que llevan contabilidad.' },
  { tipo: 'nombramiento', label: 'Nombramiento del representante legal', ayuda: 'Solo personas jurídicas.' },
]

/** Archivos mínimos por documento (0 = no aplica). Igual que el backend. */
export function minimos(tipoPersona: TipoPersona): Record<TipoDocumento, number> {
  return {
    solicitud_firmada: 1,
    cedula: 1,
    servicio_basico: 1,
    factura_proveedor: 2,
    ruc: tipoPersona === 'natural' ? 0 : 1,
    nombramiento: tipoPersona === 'juridica' ? 1 : 0,
  }
}

/** Lo que falta para poder enviar a revisión (mismo criterio que el backend). */
export function faltantes(s: SolicitudDatos): string[] {
  const f: string[] = []
  const t = s.titular
  const n = s.negocio
  if (!t.nombres.trim() || !t.apellidos.trim()) f.push('nombres y apellidos')
  if (!t.cedula.trim()) f.push('cédula')
  if (!t.formaPago) f.push('forma de pago')
  if (!n.nombre.trim()) f.push('nombre del negocio')
  if (!n.direccion.trim()) f.push('dirección del negocio')
  if (!n.celular.trim() && !n.telefono.trim()) f.push('teléfono o celular')
  if (s.tipoPersona !== 'natural' && !n.ruc.trim()) f.push('número de RUC')
  if (!s.autorizaBuro) f.push('autorización de consulta crediticia')
  const min = minimos(s.tipoPersona)
  for (const d of DOCUMENTOS) {
    const hay = s.documentos.filter((x) => x.tipo === d.tipo).length
    if (hay < min[d.tipo]) f.push(d.label.toLowerCase())
  }
  return f
}

export const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  borrador: 'Borrador',
  enviada: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export const ESTADO_TONE: Record<EstadoSolicitud, 'neutral' | 'info' | 'success' | 'danger'> = {
  borrador: 'neutral',
  enviada: 'info',
  aprobada: 'success',
  rechazada: 'danger',
}

export const PERSONA_LABEL: Record<TipoPersona, string> = {
  natural: 'Persona natural',
  obligado: 'Obligado a llevar contabilidad',
  juridica: 'Persona jurídica',
}

export function vacia(tipo: SolicitudDatos['tipo'] = 'nuevo'): SolicitudDatos {
  return {
    tipo,
    tipoPersona: 'natural',
    titular: { nombres: '', apellidos: '', cedula: '', formaPago: '' },
    negocio: { nombre: '', ruc: '', direccion: '', telefono: '', celular: '', direccionDomicilio: '', telefonoDomicilio: '' },
    refComerciales: [0, 1].map(() => ({ proveedor: '', montoMes: '', plazoPago: '', telefono: '' })),
    refBancarias: [0, 1].map(() => ({ banco: '', cuenta: '' })),
    refPersonales: [0, 1].map(() => ({ nombres: '', apellidos: '', parentesco: '', telefonos: '' })),
    autorizaBuro: false,
    documentos: [],
    observacion: '',
  }
}
