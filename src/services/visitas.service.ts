import APIBase from './httpBase'
import type { Visita, ResultadoVisita } from '@/types/erp'

interface ListResponse {
  success: boolean
  data: Visita[]
}
interface OneResponse {
  success: boolean
  data: Visita
}

class VisitasService extends APIBase {
  async list(): Promise<Visita[]> {
    const res = await this.get<ListResponse>('visitas')
    return res.data.data
  }

  async registrarEntrada(payload: {
    lat: number
    lng: number
    clienteNombre?: string
    clienteCodigo?: string
  }): Promise<Visita> {
    const res = await this.post<OneResponse>('visitas', payload)
    return res.data.data
  }

  async marcarSalida(
    id: string,
    payload: { lat?: number; lng?: number; resultado?: ResultadoVisita; observacion?: string },
  ): Promise<Visita> {
    const res = await this.patch<OneResponse>(`visitas/${id}/salida`, payload)
    return res.data.data
  }
}

export const visitasService = new VisitasService()
