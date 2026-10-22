import { defineStore } from 'pinia'
import { notasCreditoService } from '@/services/notasCredito.service'
import type { NotaCredito } from '@/types/notasCredito'
import type { ApiError } from '@/types'

export const useNotasCreditoStore = defineStore('notasCredito', {
  state: () => ({
    data: [] as NotaCredito[],
    loading: false,
    error: null as string | null,
    fetchedAt: null as number | null,
  }),

  getters: {
    porAprobar: (state) => state.data.filter((n) => n.estado === 'pendiente').length,
  },

  actions: {
    async fetch(force = false) {
      if (!force && (this.loading || this.fetchedAt)) return
      this.loading = true
      this.error = null
      try {
        this.data = await notasCreditoService.list()
        this.fetchedAt = Date.now()
      } catch (err) {
        this.error = (err as ApiError)?.message || 'No se pudieron cargar las notas de crédito'
      } finally {
        this.loading = false
      }
    },

    /** Reemplaza (o agrega) una nota tras crearla o revisarla. */
    upsert(n: NotaCredito) {
      const i = this.data.findIndex((x) => x._id === n._id)
      if (i >= 0) this.data[i] = n
      else this.data.unshift(n)
    },
  },
})
