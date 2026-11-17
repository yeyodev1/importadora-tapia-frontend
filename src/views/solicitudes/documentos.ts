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

/** Archivos mínimos por documento (0 = no aplica). Igual que el backend: sin crédito basta cédula y RUC. */
export function minimos(tipoPersona: TipoPersona, pideCredito = true): Record<TipoDocumento, number> {
  const c = pideCredito ? 1 : 0
  return {
    solicitud_firmada: c,
    cedula: 1,
    servicio_basico: c,
    factura_proveedor: 2 * c,
    ruc: tipoPersona === 'natural' ? 0 : 1,
    nombramiento: tipoPersona === 'juridica' ? c : 0,
  }
}

export const PLAZOS_CREDITO = [8, 15, 30, 45, 60]
const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Lo que falta para poder enviar a revisión (mismo criterio que el backend). */
export function faltantes(s: SolicitudDatos): string[] {
  const f: string[] = []
  const t = s.titular
  const n = s.negocio
  if (!t.nombres.trim() || !t.apellidos.trim()) f.push('nombres y apellidos')
  if (!t.cedula.trim()) f.push('cédula')
  else if (!/^\d{10}$/.test(t.cedula.trim())) f.push('cédula de 10 dígitos')
  if (!t.formaPago) f.push('forma de pago')
  if (!n.nombre.trim()) f.push('nombre del negocio')
  if (!n.direccion.trim()) f.push('dirección del negocio')
  if (!n.celular.trim() && !n.telefono.trim()) f.push('teléfono o celular')
  if (s.tipoPersona !== 'natural' && !n.ruc.trim()) f.push('número de RUC')
  if (n.ruc.trim() && !/^\d{13}$/.test(n.ruc.trim())) f.push('RUC de 13 dígitos')
  if (n.correo.trim() && !CORREO_RE.test(n.correo.trim())) f.push('correo válido')
  if (s.pideCredito) {
    if (!(Number(s.cupoSolicitado) > 0)) f.push('cupo de crédito pedido')
    if (!s.plazoDias) f.push('plazo del crédito')
    if (!s.autorizaBuro) f.push('autorización de consulta crediticia')
  }
  const min = minimos(s.tipoPersona, s.pideCredito)
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
    negocio: { nombre: '', ruc: '', direccion: '', telefono: '', celular: '', direccionDomicilio: '', telefonoDomicilio: '', correo: '' },
    ubicacion: null,
    pideCredito: true,
    cupoSolicitado: null,
    plazoDias: null,
    refComerciales: [0, 1].map(() => ({ proveedor: '', montoMes: '', plazoPago: '', telefono: '' })),
    refBancarias: [0, 1].map(() => ({ banco: '', cuenta: '' })),
    refPersonales: [0, 1].map(() => ({ nombres: '', apellidos: '', parentesco: '', telefonos: '' })),
    autorizaBuro: false,
    documentos: [],
    observacion: '',
  }
}
