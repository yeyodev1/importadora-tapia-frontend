import { defineStore } from 'pinia'
import { pedidosService } from '@/services/pedidos.service'
import type { Pedido, NuevoPedido, EstadoPedido } from '@/types/erp'
import type { ApiError } from '@/types'

export const usePedidosStore = defineStore('pedidos', {
  state: () => ({
    data: [] as Pedido[],
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
        this.data = await pedidosService.list()
        this.fetchedAt = Date.now()
      } catch (err) {
        this.error = (err as ApiError)?.message || 'No se pudieron cargar los pedidos'
      } finally {
        this.loading = false
      }
    },

    async create(payload: NuevoPedido) {
      const pedido = await pedidosService.create(payload)
      this.data.unshift(pedido)
      return pedido
    },

    /** Aprobar, poner en espera o rechazar, con el comentario para el asesor. */
    async setEstado(id: string, estado: EstadoPedido, comentario?: string) {
      const pedido = await pedidosService.setEstado(id, estado, comentario)
      const i = this.data.findIndex((p) => p._id === id)
      if (i >= 0) this.data[i] = pedido
      return pedido
    },

    async anular(id: string, motivo: string) {
      const pedido = await pedidosService.anular(id, motivo)
      const i = this.data.findIndex((p) => p._id === id)
      if (i >= 0) this.data[i] = pedido
      return pedido
    },

    async ajustar(id: string, cantidades: number[], nota?: string) {
      const pedido = await pedidosService.ajustar(id, cantidades, nota)
      const i = this.data.findIndex((p) => p._id === id)
      if (i >= 0) this.data[i] = pedido
      return pedido
    },

    /** Guarda las fotos de la OP de un pedido ya enviado. */
    async setFotos(id: string, fotos: string[]) {
      const pedido = await pedidosService.setFotos(id, fotos)
      const i = this.data.findIndex((p) => p._id === id)
      if (i >= 0) this.data[i] = pedido
      return pedido
    },

    /** Bodega: marca la salida del pedido con fotos y observación. */
    async marcarDespacho(id: string, payload: { fotos: string[]; observacion?: string; cantidades?: number[] }) {
      const pedido = await pedidosService.marcarDespacho(id, payload)
      const i = this.data.findIndex((p) => p._id === id)
      if (i >= 0) this.data[i] = pedido
      return pedido
    },

    async registrarRetraso(id: string, payload: { nuevaFecha: string; motivo: string }) {
      const pedido = await pedidosService.registrarRetraso(id, payload)
      const i = this.data.findIndex((p) => p._id === id)
      if (i >= 0) this.data[i] = pedido
      return pedido
    },
  },
})
