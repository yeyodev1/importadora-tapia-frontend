import { defineStore } from 'pinia'
import type { UserRole } from '@/types/erp'

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  role: UserRole | null
  /** Funciones extra que le dio el admin (p.ej. vendedor que también despacha en bodega). */
  rolesExtra: UserRole[]
  venCodigo: string | null
  /** Bodeguero limitado a una bodega (ej. Quito). null = todas. */
  bodega: string | null
  /** El admin pidió que ponga su propio correo: la app queda bloqueada hasta cambiarlo. */
  debeCambiarCorreo: boolean
  isAuthenticated: boolean
}

/** Datos del usuario que devuelven login, /auth/me y el cambio de correo. */
type PerfilSesion = {
  id: string
  name?: string
  email?: string
  role?: UserRole
  rolesExtra?: UserRole[]
  venCodigo?: string | null
  bodega?: string | null
  debeCambiarCorreo?: boolean
}

const KEY_DEBE_CORREO = 'user_debe_cambiar_correo'
const KEY_ROLES_EXTRA = 'user_roles_extra'

/** Funciones extra guardadas (el router las lee sin Pinia). */
export function rolesExtraGuardados(): UserRole[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY_ROLES_EXTRA) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    role: null,
    rolesExtra: [],
    venCodigo: null,
    bodega: null,
    debeCambiarCorreo: false,
    isAuthenticated: false,
  }),

  getters: {
    /** Rol principal más las funciones extra. */
    roles: (state): UserRole[] => (state.role ? [state.role, ...state.rolesExtra.filter((r) => r !== state.role)] : []),
    isAdmin: (state) => state.role === 'admin',
    isVendedor: (state) => state.role === 'vendedor',
    /** Despacha en bodega: rol bodega o vendedor con la función de bodega. */
    isBodega: (state) => state.role === 'bodega' || state.rolesExtra.includes('bodega'),
    /** Solo bodega (sin vender): la app se le limita a Despachos, Inventario y su perfil. */
    soloBodega: (state) => state.role === 'bodega',
    /** Texto del rol para mostrar (ej. "Vendedor · Bodega"). */
    rolLabel: (state) => {
      const nombre = { admin: 'Administrador', vendedor: 'Vendedor', bodega: 'Bodega' } as const
      const base = state.role ? nombre[state.role] : ''
      return [base, ...state.rolesExtra.filter((r) => r !== state.role).map((r) => nombre[r])].filter(Boolean).join(' · ')
    },
  },

  actions: {
    hydrate() {
      const token = localStorage.getItem('access_token')
      this.isAuthenticated = !!token
      this.id = localStorage.getItem('user_id')
      this.name = localStorage.getItem('user_name')
      this.email = localStorage.getItem('user_email')
      this.role = (localStorage.getItem('user_role') as UserRole) || null
      this.rolesExtra = rolesExtraGuardados()
      this.venCodigo = localStorage.getItem('user_ven_codigo')
      this.bodega = localStorage.getItem('user_bodega')
      this.debeCambiarCorreo = localStorage.getItem(KEY_DEBE_CORREO) === '1'
    },

    /** Marca (o quita) el pedido de cambiar el correo y lo deja en localStorage. */
    setDebeCambiarCorreo(valor?: boolean) {
      this.debeCambiarCorreo = Boolean(valor)
      try {
        if (this.debeCambiarCorreo) localStorage.setItem(KEY_DEBE_CORREO, '1')
        else localStorage.removeItem(KEY_DEBE_CORREO)
      } catch {}
    },

    /**
     * Refresca nombre, correo, bodega y el pedido de cambio de correo con los
     * datos de /auth/me, sin volver a iniciar sesión.
     */
    aplicarPerfil(user: PerfilSesion) {
      if (user.name) this.name = user.name
      if (user.email) this.email = user.email
      try {
        if (user.name) localStorage.setItem('user_name', user.name)
        if (user.email) localStorage.setItem('user_email', user.email)
      } catch {}
      if (user.rolesExtra) this.setRolesExtra(user.rolesExtra)
      this.setBodega(user.bodega)
      this.setDebeCambiarCorreo(user.debeCambiarCorreo)
    },

    /** Funciones extra (al iniciar sesión o al refrescar /auth/me si el admin las cambió). */
    setRolesExtra(roles?: UserRole[]) {
      this.rolesExtra = roles || []
      try {
        if (this.rolesExtra.length) localStorage.setItem(KEY_ROLES_EXTRA, JSON.stringify(this.rolesExtra))
        else localStorage.removeItem(KEY_ROLES_EXTRA)
      } catch {}
    },

    /** Actualiza la bodega asignada (al refrescar /auth/me sin volver a iniciar sesión). */
    setBodega(bodega?: string | null) {
      this.bodega = bodega || null
      try {
        if (this.bodega) localStorage.setItem('user_bodega', this.bodega)
        else localStorage.removeItem('user_bodega')
      } catch {}
    },

    /** Tras cambiar el correo: el token viejo lleva el correo anterior, se reemplaza. */
    correoCambiado(token: string, user: PerfilSesion) {
      try {
        if (token) localStorage.setItem('access_token', token)
      } catch {}
      this.aplicarPerfil(user)
    },

    login(token: string, user: PerfilSesion) {
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
      this.setRolesExtra(user.rolesExtra)
      this.setDebeCambiarCorreo(user.debeCambiarCorreo)
      this.isAuthenticated = true
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.role = null
      this.rolesExtra = []
      this.venCodigo = null
      this.bodega = null
      this.debeCambiarCorreo = false
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
          KEY_DEBE_CORREO,
          KEY_ROLES_EXTRA,
        ]) {
          localStorage.removeItem(k)
        }
      } catch {}
    },
  },
})
