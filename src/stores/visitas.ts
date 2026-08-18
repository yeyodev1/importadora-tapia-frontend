import { defineStore } from 'pinia'
import { visitasService } from '@/services/visitas.service'
import { obtenerUbicacion } from '@/utils/geo'
import type { Visita, ResultadoVisita } from '@/types/erp'
import type { ApiError } from '@/types'

export const useVisitasStore = defineStore('visitas', {
  state: () => ({
    data: [] as Visita[],
    loading: false,
    error: null as string | null,
    fetchedAt: null as number | null,
  }),

  getters: {
    enCurso: (state) => state.data.find((v) => v.estado === 'en_curso') || null,
  },

  actions: {
    async fetch(force = false) {
      if (!force && (this.loading || this.fetchedAt)) return
      this.loading = true
      this.error = null
      try {
        this.data = await visitasService.list()
        this.fetchedAt = Date.now()
      } catch (err) {
        this.error = (err as ApiError)?.message || 'No se pudieron cargar las visitas'
      } finally {
        this.loading = false
      }
    },

    /** Captura el GPS (obligatorio) y registra la llegada. */
    async registrarLlegada(cliente?: { nombre?: string; codigo?: string }) {
      const { lat, lng } = await obtenerUbicacion()
      const visita = await visitasService.registrarEntrada({
        lat,
        lng,
        clienteNombre: cliente?.nombre,
        clienteCodigo: cliente?.codigo,
      })
      this.data.unshift(visita)
      return visita
    },

    /** Captura el GPS de salida y cierra la visita. */
    async marcarSalida(id: string, resultado?: ResultadoVisita, observacion?: string) {
      let coords: { lat?: number; lng?: number } = {}
      try {
        coords = await obtenerUbicacion()
      } catch {
        // Si no hay GPS en la salida, se cierra con la ubicación de entrada.
      }
      const visita = await visitasService.marcarSalida(id, { ...coords, resultado, observacion })
      const i = this.data.findIndex((v) => v._id === id)
      if (i >= 0) this.data[i] = visita
      return visita
    },
  },
})
