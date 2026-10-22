import APIBase from './httpBase'
import type { MotivoNotaCredito, NotaCredito } from '@/types/notasCredito'

interface One {
  success: boolean
  data: NotaCredito
}

class NotasCreditoService extends APIBase {
  async list(): Promise<NotaCredito[]> {
    const res = await this.get<{ success: boolean; data: NotaCredito[] }>('notas-credito')
    return res.data.data
  }

  async create(datos: {
    clienteCodigo: string
    clienteNombre: string
    motivo: MotivoNotaCredito
    comentario: string
  }): Promise<NotaCredito> {
    const res = await this.post<One>('notas-credito', datos)
    return res.data.data
  }

  async setEstado(id: string, estado: 'aprobada' | 'rechazada', motivo?: string): Promise<NotaCredito> {
    const res = await this.patch<One>(`notas-credito/${id}/estado`, { estado, motivo })
    return res.data.data
  }
}

export const notasCreditoService = new NotasCreditoService()
