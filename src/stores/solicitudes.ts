import { defineStore } from 'pinia'
import { solicitudesService } from '@/services/solicitudes.service'
import type { SolicitudCredito } from '@/types/solicitudes'
import type { ApiError } from '@/types'

export const useSolicitudesStore = defineStore('solicitudes', {
  state: () => ({
    data: [] as SolicitudCredito[],
    loading: false,
    error: null as string | null,
    fetchedAt: null as number | null,
  }),

  getters: {
    porRevisar: (state) => state.data.filter((s) => s.estado === 'enviada').length,
  },

  actions: {
    async fetch(force = false) {
      if (!force && (this.loading || this.fetchedAt)) return
      this.loading = true
      this.error = null
      try {
        this.data = await solicitudesService.list()
        this.fetchedAt = Date.now()
      } catch (err) {
        this.error = (err as ApiError)?.message || 'No se pudieron cargar las solicitudes'
      } finally {
        this.loading = false
      }
    },

    /** Reemplaza (o agrega) una solicitud tras guardarla o revisarla. */
    upsert(s: SolicitudCredito) {
      const i = this.data.findIndex((x) => x._id === s._id)
      if (i >= 0) this.data[i] = s
      else this.data.unshift(s)
    },
  },
})
