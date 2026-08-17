import { defineStore } from 'pinia'
import { cobrosService } from '@/services/cobros.service'
import type { Cobro, NuevoCobro } from '@/types/erp'
import type { ApiError } from '@/types'

export const useCobrosStore = defineStore('cobros', {
  state: () => ({
    data: [] as Cobro[],
    loading: false,
    error: null as string | null,
    fetchedAt: null as number | null,
  }),

  actions: {
    async fetch(force = false) {
      if (!force && (this.loading || this.fetchedAt)) return
      this.loading = true
      this.error = null
      try {
        this.data = await cobrosService.list()
        this.fetchedAt = Date.now()
      } catch (err) {
        this.error = (err as ApiError)?.message || 'No se pudieron cargar los cobros'
      } finally {
        this.loading = false
      }
    },

    async create(payload: NuevoCobro) {
      const cobro = await cobrosService.create(payload)
      this.data.unshift(cobro)
      return cobro
    },

    async setEstado(id: string, estado: 'aplicado' | 'rechazado' | 'registrado') {
      const cobro = await cobrosService.setEstado(id, estado)
      const i = this.data.findIndex((c) => c._id === id)
      if (i >= 0) this.data[i] = cobro
      return cobro
    },
  },
})
