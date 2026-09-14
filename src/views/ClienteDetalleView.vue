<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErpStore } from '@/stores/erp'
import { useUserStore } from '@/stores/user'
import { ref } from 'vue'
import ClienteResumenCredito from './cliente/ClienteResumenCredito.vue'
import ClienteFacturasTabla from './cliente/ClienteFacturasTabla.vue'
import ClienteSolicitudes from './cliente/ClienteSolicitudes.vue'
import CobroFormModal from './cobros/CobroFormModal.vue'
import PedidoFormModal from './pedidos/PedidoFormModal.vue'
import { initials } from '@/utils/format'
import SourceTag from '@/components/ui/SourceTag.vue'

/** Tope de facturas abiertas por cliente (política actual; el ERP guarda el real por cliente). */
const MAX_FACTURAS = 6

const route = useRoute()
const router = useRouter()
const erp = useErpStore()
const userStore = useUserStore()

onMounted(() => {
  erp.fetchClientes()
  erp.fetchCarteraFacturas()
  erp.fetchCarteraConsolidada()
})

const cliente = computed(() =>
  erp.clientes.data.find((c) => c.per_codigo === String(route.params.codigo)),
)

const facturas = computed(() =>
  cliente.value
    ? erp.carteraFacturas.data.filter((f) => f.per_nombre === cliente.value!.per_nombre)
    : [],
)

const deudaTotal = computed(() =>
  Number(
    erp.carteraConsolidada.data.find((d) => d.per_codigo === cliente.value?.per_codigo)
      ?.deuda_total || 0,
  ),
)

const loading = computed(
  () => erp.clientes.loading || erp.carteraFacturas.loading || erp.carteraConsolidada.loading,
)

const telefono = computed(() => {
  const m = String(cliente.value?.per_telefono || '').match(/\d{7,10}/)
  return m ? m[0] : ''
})

const cobroOpen = ref(false)
const pedidoOpen = ref(false)
</script>

<template>
  <div>
    <button class="volver" type="button" @click="router.back()">← Volver</button>

    <div v-if="loading && !cliente" class="hero hero--skeleton">
      <span class="skeleton" style="width: 54px; height: 54px; border-radius: 50%" />
      <div style="flex: 1">
        <span class="skeleton" style="width: 45%; height: 18px; display: block" />
        <span class="skeleton" style="width: 30%; height: 12px; display: block; margin-top: 8px" />
      </div>
    </div>

    <template v-else-if="cliente">
      <section class="hero">
        <span class="hero__avatar">{{ initials(cliente.per_nombre) }}</span>
        <div class="hero__info">
          <h1>{{ cliente.per_nombre }}</h1>
          <p class="hero__id">RUC/CI {{ cliente.per_identificacion }} · código {{ cliente.per_codigo }}</p>
          <p class="hero__dir">{{ cliente.per_direccion || 'Sin dirección registrada' }}</p>
          <p v-if="userStore.isAdmin" class="hero__vendedor">
            Vendedor asignado (ERP): <b>{{ cliente.ven_nombre }}</b>
          </p>
        </div>
        <div class="hero__actions">
          <button class="is-pedido" type="button" @click="pedidoOpen = true">Nuevo pedido</button>
          <button class="is-cobro" type="button" @click="cobroOpen = true">Registrar cobro</button>
          <a v-if="telefono" :href="`tel:${telefono}`">Llamar</a>
        </div>
      </section>

      <ClienteResumenCredito
        class="bloque"
        :facturas="facturas"
        :deuda-total="deudaTotal"
        :max-facturas="MAX_FACTURAS"
      />

      <ClienteSolicitudes class="bloque" :codigo="cliente.per_codigo" />

      <h2 class="seccion">
        Facturas con saldo pendiente <small>{{ facturas.length }}</small>
        <SourceTag source="erp" :updated-at="erp.carteraFacturas.fetchedAt" />
      </h2>

      <ClienteFacturasTabla
        :facturas="facturas"
        :loading="erp.carteraFacturas.loading && !erp.carteraFacturas.fetchedAt"
        :error="erp.carteraFacturas.error"
        @retry="erp.fetchCarteraFacturas(true)"
      />

      <CobroFormModal
        :open="cobroOpen"
        :cliente-nombre="cliente.per_nombre"
        :cliente-codigo="cliente.per_codigo"
        @close="cobroOpen = false"
      />
      <PedidoFormModal
        :open="pedidoOpen"
        :cliente-nombre="cliente.per_nombre"
        :cliente-codigo="cliente.per_codigo"
        @close="pedidoOpen = false"
      />
    </template>

    <div v-else class="no-encontrado">
      <p>No se encontró el cliente <b>{{ route.params.codigo }}</b> entre tus clientes asignados.</p>
      <RouterLink to="/clientes">Ir a Clientes</RouterLink>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './cliente/cliente-detalle';
</style>
