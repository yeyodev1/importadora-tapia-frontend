import APIBase from './httpBase'
import type { FirmaSubida, SolicitudCredito, SolicitudDatos } from '@/types/solicitudes'

interface One {
  success: boolean
  data: SolicitudCredito
}

class SolicitudesService extends APIBase {
  async list(clienteCodigo?: string): Promise<SolicitudCredito[]> {
    const q = clienteCodigo ? `?clienteCodigo=${encodeURIComponent(clienteCodigo)}` : ''
    const res = await this.get<{ success: boolean; data: SolicitudCredito[] }>(`solicitudes${q}`)
    return res.data.data
  }

  async getOne(id: string): Promise<SolicitudCredito> {
    const res = await this.get<One>(`solicitudes/${id}`)
    return res.data.data
  }

  /** `enviar` = mandarla a revisión (exige datos y documentos completos). */
  async create(datos: SolicitudDatos, enviar: boolean): Promise<SolicitudCredito> {
    const res = await this.post<One>('solicitudes', { ...datos, enviar })
    return res.data.data
  }

  async update(id: string, datos: SolicitudDatos, enviar: boolean): Promise<SolicitudCredito> {
    const res = await this.put<One>(`solicitudes/${id}`, { ...datos, enviar })
    return res.data.data
  }

  async setEstado(id: string, estado: 'aprobada' | 'rechazada', motivo?: string): Promise<SolicitudCredito> {
    const res = await this.patch<One>(`solicitudes/${id}/estado`, { estado, motivo })
    return res.data.data
  }

  /** Relaciona con un cliente del ERP; código vacío = quitar la relación. */
  async vincular(id: string, clienteCodigo: string): Promise<SolicitudCredito> {
    const res = await this.patch<One>(`solicitudes/${id}/vincular`, { clienteCodigo })
    return res.data.data
  }

  async firmaSubida(): Promise<FirmaSubida> {
    const res = await this.post<{ success: boolean; data: FirmaSubida }>('solicitudes/firma-subida', {})
    return res.data.data
  }
}

export const solicitudesService = new SolicitudesService()
