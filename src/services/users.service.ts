import APIBase from './httpBase'
import type { AppUser, UserRole } from '@/types/erp'

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
    payload: Partial<Pick<CreateUserPayload, 'password' | 'name' | 'venCodigo'>>,
  ): Promise<AppUser> {
    const res = await this.patch<UserResponse>(`users/${id}`, payload)
    return res.data.data
  }

  async remove(id: string): Promise<void> {
    await this.delete(`users/${id}`)
  }
}

export const usersService = new UsersService()
