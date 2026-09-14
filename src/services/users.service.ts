import APIBase from './httpBase'
import type { AppUser, UserRole, VendedorOculto } from '@/types/erp'

interface UsersResponse {
  success: boolean
  data: AppUser[]
}

interface UserResponse {
  success: boolean
  data: AppUser
  /** Sólo al crear: si se pudo enviar el correo con las credenciales. */
  emailSent?: boolean
}

export interface CreateUserPayload {
  email: string
  password: string
  role: UserRole
  venCodigo?: string
  name?: string
}

class UsersService extends APIBase {
  async list(): Promise<AppUser[]> {
    const res = await this.get<UsersResponse>('users')
    return res.data.data
  }

  async create(payload: CreateUserPayload): Promise<{ user: AppUser; emailSent: boolean }> {
    const res = await this.post<UserResponse>('users', payload)
    return { user: res.data.data, emailSent: Boolean(res.data.emailSent) }
  }

  async update(
    id: string,
    payload: Partial<Pick<CreateUserPayload, 'email' | 'password' | 'name' | 'venCodigo'>>,
  ): Promise<AppUser> {
    const res = await this.patch<UserResponse>(`users/${id}`, payload)
    return res.data.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`users/${id}`)
  }

  async vendedoresOcultos(): Promise<VendedorOculto[]> {
    const res = await this.get<{ success: boolean; data: VendedorOculto[] }>('users/vendedores-ocultos')
    return res.data.data
  }

  async ocultarVendedor(venCodigo: string, venNombre: string, motivo?: string): Promise<VendedorOculto> {
    const res = await this.post<{ success: boolean; data: VendedorOculto }>('users/vendedores-ocultos', { venCodigo, venNombre, motivo })
    return res.data.data
  }

  async restaurarVendedor(venCodigo: string): Promise<void> {
    await this.delete(`users/vendedores-ocultos/${venCodigo}`)
  }
}

export const usersService = new UsersService()
