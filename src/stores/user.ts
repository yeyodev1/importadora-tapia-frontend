import { defineStore } from 'pinia'
import type { UserRole } from '@/types/erp'

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  role: UserRole | null
  venCodigo: string | null
  /** Bodeguero limitado a una bodega (ej. Quito). null = todas. */
  bodega: string | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    role: null,
    venCodigo: null,
    bodega: null,
    isAuthenticated: false,
  }),

  getters: {
    isAdmin: (state) => state.role === 'admin',
    isVendedor: (state) => state.role === 'vendedor',
    isBodega: (state) => state.role === 'bodega',
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
      this.bodega = localStorage.getItem('user_bodega')
    },

    /** Actualiza la bodega asignada (al refrescar /auth/me sin volver a iniciar sesión). */
    setBodega(bodega?: string | null) {
      this.bodega = bodega || null
      try {
        if (this.bodega) localStorage.setItem('user_bodega', this.bodega)
        else localStorage.removeItem('user_bodega')
      } catch {}
    },

    login(
      token: string,
      user: { id: string; name?: string; email?: string; role?: UserRole; venCodigo?: string | null; bodega?: string },
    ) {
      try {
        localStorage.setItem('access_token', token)
        localStorage.setItem('user_id', user.id)
        if (user.name) localStorage.setItem('user_name', user.name)
        if (user.email) localStorage.setItem('user_email', user.email)
        if (user.role) localStorage.setItem('user_role', user.role)
        if (user.venCodigo) localStorage.setItem('user_ven_codigo', user.venCodigo)
        else localStorage.removeItem('user_ven_codigo')
        if (user.bodega) localStorage.setItem('user_bodega', user.bodega)
        else localStorage.removeItem('user_bodega')
      } catch {}
      this.id = user.id
      this.name = user.name || null
      this.email = user.email || null
      this.role = user.role || null
      this.venCodigo = user.venCodigo || null
      this.bodega = user.bodega || null
      this.isAuthenticated = true
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.role = null
      this.venCodigo = null
      this.bodega = null
      this.isAuthenticated = false
      try {
        for (const k of [
          'access_token',
          'user_id',
          'user_name',
          'user_email',
          'user_role',
          'user_ven_codigo',
          'user_bodega',
        ]) {
          localStorage.removeItem(k)
        }
      } catch {}
    },
  },
})
