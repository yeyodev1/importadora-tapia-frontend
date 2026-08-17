import { defineStore } from 'pinia'
import { erpService } from '@/services/erp.service'
import type {
  Cliente,
  Vendedor,
  FacturaCartera,
  CarteraConsolidada,
  InventarioItem,
} from '@/types/erp'
import type { ApiError } from '@/types'

interface ResourceState<T> {
  data: T[]
  loading: boolean
  error: string | null
  fetchedAt: number | null
}

function emptyResource<T>(): ResourceState<T> {
  return { data: [], loading: false, error: null, fetchedAt: null }
}

/** Cache de 2 minutos: navegar entre vistas no re-descarga todo el ERP. */
const CACHE_MS = 2 * 60 * 1000

export const useErpStore = defineStore('erp', {
  state: () => ({
    clientes: emptyResource<Cliente>(),
    vendedores: emptyResource<Vendedor>(),
    inventario: emptyResource<InventarioItem>(),
    carteraFacturas: emptyResource<FacturaCartera>(),
    carteraConsolidada: emptyResource<CarteraConsolidada>(),
  }),

  actions: {
    async fetchResource(
      key: 'clientes' | 'vendedores' | 'inventario' | 'carteraFacturas' | 'carteraConsolidada',
      loader: () => Promise<unknown[]>,
      force = false,
    ) {
      const resource = this[key] as ResourceState<unknown>
      const fresh = resource.fetchedAt && Date.now() - resource.fetchedAt < CACHE_MS
      if (!force && (fresh || resource.loading)) return

      resource.loading = true
      resource.error = null
      try {
        resource.data = await loader()
        resource.fetchedAt = Date.now()
      } catch (err) {
        const e = err as ApiError
        resource.error = e?.message || 'No se pudo cargar la información'
      } finally {
        resource.loading = false
      }
    },

    fetchClientes(force = false) {
      return this.fetchResource('clientes', () => erpService.getClientes(), force)
    },
    fetchVendedores(force = false) {
      return this.fetchResource('vendedores', () => erpService.getVendedores(), force)
    },
    fetchInventario(force = false) {
      return this.fetchResource('inventario', () => erpService.getInventario(), force)
    },
    fetchCarteraFacturas(force = false) {
      return this.fetchResource('carteraFacturas', () => erpService.getCarteraFacturas(), force)
    },
    fetchCarteraConsolidada(force = false) {
      return this.fetchResource('carteraConsolidada', () => erpService.getCarteraConsolidada(), force)
    },
  },
})
