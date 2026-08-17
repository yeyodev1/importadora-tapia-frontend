import { defineStore } from 'pinia'
import type { UserRole } from '@/types/erp'

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  role: UserRole | null
  venCodigo: string | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    role: null,
    venCodigo: null,
    isAuthenticated: false,
  }),

  getters: {
    isAdmin: (state) => state.role === 'admin',
  },

  actions: {
    hydrate() {
      const token = localStorage.getItem('access_token')
      this.isAuthenticated = !!token
      this.id = localStorage.getItem('user_id')
      this.name = localStorage.getItem('user_name')
      this.email = localStorage.getItem('user_email')
      this.role = (localStorage.getItem('user_role') as UserRole) || null
      this.venCodigo = localStorage.getItem('user_ven_codigo')
    },

    login(
      token: string,
      user: { id: string; name?: string; email?: string; role?: UserRole; venCodigo?: string | null },
    ) {
      try {
        localStorage.setItem('access_token', token)
        localStorage.setItem('user_id', user.id)
        if (user.name) localStorage.setItem('user_name', user.name)
        if (user.email) localStorage.setItem('user_email', user.email)
        if (user.role) localStorage.setItem('user_role', user.role)
        if (user.venCodigo) localStorage.setItem('user_ven_codigo', user.venCodigo)
        else localStorage.removeItem('user_ven_codigo')
      } catch {}
      this.id = user.id
      this.name = user.name || null
      this.email = user.email || null
      this.role = user.role || null
      this.venCodigo = user.venCodigo || null
      this.isAuthenticated = true
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.role = null
      this.venCodigo = null
      this.isAuthenticated = false
      try {
        for (const k of [
          'access_token',
          'user_id',
          'user_name',
          'user_email',
          'user_role',
          'user_ven_codigo',
        ]) {
          localStorage.removeItem(k)
        }
      } catch {}
    },
  },
})
