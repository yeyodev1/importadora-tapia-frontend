import APIBase from './httpBase'
import type {
  Cliente,
  Vendedor,
  FacturaCartera,
  CarteraConsolidada,
  InventarioItem,
  InventarioDisponible,
  ErpListResponse,
  LoginResponse,
  EstadoErp,
} from '@/types/erp'

class ErpService extends APIBase {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await this.post<LoginResponse>('auth/login', { email, password })
    return res.data
  }

  async me(): Promise<LoginResponse['user']> {
    const res = await this.get<{ success: boolean; user: LoginResponse['user'] }>('auth/me')
    return res.data.user
  }

  /** Diagnóstico de conexión con el ERP (ping real + estado del cache). */
  async estadoErp(): Promise<EstadoErp> {
    const res = await this.get<EstadoErp>('estado/erp')
    return res.data
  }

  async getClientes(): Promise<Cliente[]> {
    const res = await this.get<ErpListResponse<Cliente>>('erp/clientes')
    return res.data.data
  }

  async getVendedores(): Promise<Vendedor[]> {
    const res = await this.get<ErpListResponse<Vendedor>>('erp/vendedores')
    return res.data.data
  }

  async getInventario(): Promise<InventarioItem[]> {
    const res = await this.get<ErpListResponse<InventarioItem>>('erp/inventario')
    return res.data.data
  }

  /** Inventario con la reserva de pedidos descontada (disponible real). */
  async getInventarioDisponible(): Promise<InventarioDisponible[]> {
    const res = await this.get<ErpListResponse<InventarioDisponible>>('inventario/disponible')
    return res.data.data
  }

  async getCarteraFacturas(): Promise<FacturaCartera[]> {
    const res = await this.get<ErpListResponse<FacturaCartera>>('erp/cartera/facturas')
    return res.data.data
  }

  async getCarteraConsolidada(): Promise<CarteraConsolidada[]> {
    const res = await this.get<ErpListResponse<CarteraConsolidada>>('erp/cartera/consolidada')
    return res.data.data
  }
}

export const erpService = new ErpService()
