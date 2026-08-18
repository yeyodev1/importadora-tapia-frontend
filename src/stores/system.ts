import { defineStore } from 'pinia'
import { erpService } from '@/services/erp.service'
import type { EstadoErp } from '@/types/erp'

export const useSystemStore = defineStore('system', {
  state: () => ({
    erp: null as EstadoErp | null,
    checking: false,
    lastCheck: null as number | null,
  }),

  getters: {
    /** true = ERP en vivo; false = sirviendo la última copia guardada. */
    erpConectado: (state) => state.erp?.conectado ?? true,
    motivo: (state) => state.erp?.motivo || '',
    ultimaSync: (state) => state.erp?.ultimaSincronizacion || null,
  },

  actions: {
    async check() {
      if (this.checking) return
      this.checking = true
      try {
        this.erp = await erpService.estadoErp()
        this.lastCheck = Date.now()
      } catch {
        // Si ni el estado responde, asumimos backend caído (no ERP).
        this.erp = null
      } finally {
        this.checking = false
      }
    },
  },
})
