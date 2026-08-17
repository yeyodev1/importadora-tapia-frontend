import APIBase from './httpBase'
import type { Cobro, NuevoCobro } from '@/types/erp'

interface ListResponse {
  success: boolean
  data: Cobro[]
}
interface OneResponse {
  success: boolean
  data: Cobro
}

class CobrosService extends APIBase {
  async list(): Promise<Cobro[]> {
    const res = await this.get<ListResponse>('cobros')
    return res.data.data
  }

  async create(payload: NuevoCobro): Promise<Cobro> {
    const res = await this.post<OneResponse>('cobros', payload)
    return res.data.data
  }

  async setEstado(id: string, estado: 'aplicado' | 'rechazado' | 'registrado'): Promise<Cobro> {
    const res = await this.patch<OneResponse>(`cobros/${id}/estado`, { estado })
    return res.data.data
  }
}

export const cobrosService = new CobrosService()
