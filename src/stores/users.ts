import { defineStore } from 'pinia'
import { usersService, type CreateUserPayload } from '@/services/users.service'
import type { AppUser } from '@/types/erp'
import type { ApiError } from '@/types'

export const useUsersStore = defineStore('users', {
  state: () => ({
    data: [] as AppUser[],
    loading: false,
    error: null as string | null,
    fetchedAt: null as number | null,
  }),

  getters: {
    /** Códigos de vendedor del ERP que ya tienen cuenta en la app. */
    venCodigosConCuenta: (state) =>
      new Set(state.data.filter((u) => u.venCodigo).map((u) => u.venCodigo as string)),
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
      const user = await usersService.create(payload)
      this.data.push(user)
      return user
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
  },
})
