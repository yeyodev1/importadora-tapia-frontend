import { defineStore } from 'pinia'
import { facturaAdjuntosService } from '@/services/facturaAdjuntos.service'
import { subirArchivo } from '@/utils/subirDocumento'
import type { FacturaAdjunto } from '@/types/erp'
import type { ApiError } from '@/types'

export const useFacturaAdjuntosStore = defineStore('facturaAdjuntos', {
  state: () => ({
    data: [] as FacturaAdjunto[],
    loading: false,
    error: null as string | null,
    fetchedAt: null as number | null,
  }),

  getters: {
    /** trc_codigo -> fotos/PDF de esa factura. */
    porFactura: (state) => {
      const map = new Map<string, FacturaAdjunto[]>()
      for (const a of state.data) {
        const lista = map.get(a.trcCodigo) || []
        lista.push(a)
        map.set(a.trcCodigo, lista)
      }
      return map
    },
  },

  actions: {
    async fetch(force = false) {
      if (!force && (this.loading || this.fetchedAt)) return
      this.loading = true
      this.error = null
      try {
        this.data = await facturaAdjuntosService.list()
        this.fetchedAt = Date.now()
      } catch (err) {
        this.error = (err as ApiError)?.message || 'No se pudieron cargar las fotos de facturas'
      } finally {
        this.loading = false
      }
    },

    /** Sube el archivo a Cloudinary y lo liga a la factura. */
    async subir(trcCodigo: string, file: File) {
      const archivo = await subirArchivo(file, () => facturaAdjuntosService.firmaSubida())
      const adjunto = await facturaAdjuntosService.crear(trcCodigo, archivo)
      this.data.unshift(adjunto)
      return adjunto
    },

    async quitar(id: string) {
      await facturaAdjuntosService.eliminar(id)
      this.data = this.data.filter((a) => a._id !== id)
    },
  },
})
