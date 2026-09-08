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
  AsignacionInventario,
  ReglaProducto,
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

  /** Inventario asignado al usuario autenticado (para explicar el filtro en pantalla). */
  async miAsignacionInventario(): Promise<AsignacionInventario> {
    const res = await this.get<{ success: boolean; data: AsignacionInventario }>('inventario/asignaciones/mia')
    return res.data.data
  }

  async getAsignacionesInventario(): Promise<AsignacionInventario[]> {
    const res = await this.get<{ success: boolean; data: AsignacionInventario[] }>('inventario/asignaciones')
    return res.data.data
  }

  async guardarAsignacionInventario(venCodigo: string, payload: { restringido: boolean; productos: string[] }): Promise<AsignacionInventario> {
    const res = await this.put<{ success: boolean; data: AsignacionInventario }>(`inventario/asignaciones/${venCodigo}`, payload)
    return res.data.data
  }

  async getReglasProducto(): Promise<ReglaProducto[]> {
    const res = await this.get<{ success: boolean; data: ReglaProducto[] }>('inventario/reglas')
    return res.data.data
  }

  /** Marca o desmarca un producto como "solo contado" (admin). */
  async guardarReglaProducto(proCodigo: string, payload: { soloContado: boolean; proNombre?: string }): Promise<ReglaProducto> {
    const res = await this.put<{ success: boolean; data: ReglaProducto }>(`inventario/reglas/${encodeURIComponent(proCodigo)}`, payload)
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
