import APIBase from './httpBase'
import type { AppUser, UserRole } from '@/types/erp'

interface UsersResponse {
  success: boolean
  data: AppUser[]
}

interface UserResponse {
  success: boolean
  data: AppUser
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

  async create(payload: CreateUserPayload): Promise<AppUser> {
    const res = await this.post<UserResponse>('users', payload)
    return res.data.data
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
