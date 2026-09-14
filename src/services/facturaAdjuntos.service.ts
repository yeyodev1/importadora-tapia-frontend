import APIBase from './httpBase'
import type { FacturaAdjunto } from '@/types/erp'
import type { FirmaSubida } from '@/types/solicitudes'
import type { ArchivoSubido } from '@/utils/subirDocumento'

/** Fotos/PDF de facturas físicas ligadas a las facturas del ERP. */
class FacturaAdjuntosService extends APIBase {
  async list(): Promise<FacturaAdjunto[]> {
    const res = await this.get<{ success: boolean; data: FacturaAdjunto[] }>('erp/cartera/adjuntos')
    return res.data.data
  }

  async crear(trcCodigo: string, archivo: ArchivoSubido): Promise<FacturaAdjunto> {
    const res = await this.post<{ success: boolean; data: FacturaAdjunto }>(
      `erp/cartera/facturas/${encodeURIComponent(trcCodigo)}/adjuntos`,
      archivo,
    )
    return res.data.data
  }

  async eliminar(id: string): Promise<void> {
    await this.delete(`erp/cartera/adjuntos/${id}`)
  }

  async firmaSubida(): Promise<FirmaSubida> {
    const res = await this.post<{ success: boolean; data: FirmaSubida }>('erp/cartera/firma-subida', {})
    return res.data.data
  }
}

export const facturaAdjuntosService = new FacturaAdjuntosService()
