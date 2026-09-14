import APIBase from './httpBase'
import type { Pedido, NuevoPedido } from '@/types/erp'
import type { FirmaSubida } from '@/types/solicitudes'

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

  /** Reemplaza las fotos de la OP de un pedido ya enviado (agregar, cambiar o quitar). */
  async setFotos(id: string, fotos: string[]): Promise<Pedido> {
    const res = await this.patch<OneResponse>(`pedidos/${id}/fotos`, { fotos })
    return res.data.data
  }

  /** Pedidos que cambiaron desde `desde` (alertas con sonido sin recargar). */
  async novedades(desde?: string): Promise<{ data: Pedido[]; ahora: string }> {
    const q = desde ? `?desde=${encodeURIComponent(desde)}` : ''
    const res = await this.get<{ success: boolean; data: Pedido[]; ahora: string }>(`pedidos/novedades${q}`)
    return { data: res.data.data, ahora: res.data.ahora }
  }

  /** Bodega marca la salida (o, si ya salió, actualiza fotos y observación). */
  async marcarDespacho(id: string, payload: { fotos: string[]; observacion?: string }): Promise<Pedido> {
    const res = await this.patch<OneResponse>(`pedidos/${id}/despacho`, payload)
    return res.data.data
  }

  /** Firma para subir la foto de la orden de pedido (OP) directo a Cloudinary. */
  async firmaSubida(): Promise<FirmaSubida> {
    const res = await this.post<{ success: boolean; data: FirmaSubida }>('pedidos/firma-subida', {})
    return res.data.data
  }
}

export const pedidosService = new PedidosService()
