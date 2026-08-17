import { defineStore } from 'pinia'
import { pedidosService } from '@/services/pedidos.service'
import type { Pedido, NuevoPedido } from '@/types/erp'
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

    async setEstado(id: string, estado: 'aprobado' | 'rechazado' | 'enviado', motivo?: string) {
      const pedido = await pedidosService.setEstado(id, estado, motivo)
      const i = this.data.findIndex((p) => p._id === id)
      if (i >= 0) this.data[i] = pedido
      return pedido
    },
  },
})
