import APIBase from './httpBase'
import type { Pedido, NuevoPedido } from '@/types/erp'

interface ListResponse {
  success: boolean
  data: Pedido[]
}
interface OneResponse {
  success: boolean
  data: Pedido
}

class PedidosService extends APIBase {
  async list(): Promise<Pedido[]> {
    const res = await this.get<ListResponse>('pedidos')
    return res.data.data
  }

  async create(payload: NuevoPedido): Promise<Pedido> {
    const res = await this.post<OneResponse>('pedidos', payload)
    return res.data.data
  }

  async setEstado(
    id: string,
    estado: 'aprobado' | 'rechazado' | 'enviado',
    motivoRechazo?: string,
  ): Promise<Pedido> {
    const res = await this.patch<OneResponse>(`pedidos/${id}/estado`, { estado, motivoRechazo })
    return res.data.data
  }
}

export const pedidosService = new PedidosService()
