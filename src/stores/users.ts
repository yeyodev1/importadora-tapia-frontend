import { defineStore } from 'pinia'
import { usersService, type CreateUserPayload } from '@/services/users.service'
import type { AppUser, VendedorOculto } from '@/types/erp'
import type { ApiError } from '@/types'

export const useUsersStore = defineStore('users', {
  state: () => ({
    data: [] as AppUser[],
    loading: false,
    error: null as string | null,
    fetchedAt: null as number | null,
    /** Vendedores del ERP ocultos (ya no trabajan con Tapia). */
    ocultos: [] as VendedorOculto[],
    ocultosFetched: false,
  }),

  getters: {
    /** Códigos de vendedor del ERP que ya tienen cuenta en la app. */
    venCodigosConCuenta: (state) =>
      new Set(state.data.filter((u) => u.venCodigo).map((u) => u.venCodigo as string)),
    venCodigosOcultos: (state) => new Set(state.ocultos.map((o) => o.venCodigo)),
  },

  actions: {
    async fetch(force = false) {
      if (!force && (this.loading || this.fetchedAt)) return
      this.loading = true
      this.error = null
      try {
        this.data = await usersService.list()
        this.fetchedAt = Date.now()
      } catch (err) {
        this.error = (err as ApiError)?.message || 'No se pudo cargar el equipo'
      } finally {
        this.loading = false
      }
    },

    async create(payload: CreateUserPayload) {
      const { user, emailSent } = await usersService.create(payload)
      this.data.push(user)
      return { user, emailSent }
    },

    async update(id: string, payload: Parameters<typeof usersService.update>[1]) {
      const user = await usersService.update(id, payload)
      const i = this.data.findIndex((u) => u.id === id)
      if (i >= 0) this.data[i] = user
      return user
    },

    async remove(id: string) {
      await usersService.remove(id)
      this.data = this.data.filter((u) => u.id !== id)
    },

    async fetchOcultos(force = false) {
      if (!force && this.ocultosFetched) return
      try {
        this.ocultos = await usersService.vendedoresOcultos()
        this.ocultosFetched = true
      } catch {
        // Sin la lista, simplemente no se oculta nada.
      }
    },

    async ocultarVendedor(venCodigo: string, venNombre: string, motivo?: string) {
      const row = await usersService.ocultarVendedor(venCodigo, venNombre, motivo)
      this.ocultos = [...this.ocultos.filter((o) => o.venCodigo !== venCodigo), row]
    },

    async restaurarVendedor(venCodigo: string) {
      await usersService.restaurarVendedor(venCodigo)
      this.ocultos = this.ocultos.filter((o) => o.venCodigo !== venCodigo)
    },
  },
})
