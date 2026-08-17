<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErpStore } from '@/stores/erp'
import { useUserStore } from '@/stores/user'
import { ref } from 'vue'
import ClienteResumenCredito from './cliente/ClienteResumenCredito.vue'
import ClienteFacturasTabla from './cliente/ClienteFacturasTabla.vue'
import CobroFormModal from './cobros/CobroFormModal.vue'
import PedidoFormModal from './pedidos/PedidoFormModal.vue'
import { initials } from '@/utils/format'

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

      <h2 class="seccion">Facturas (últimos 2 años) <small>{{ facturas.length }}</small></h2>

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
.volver {
  margin-bottom: 14px;
  padding: 7px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  background: var(--surface);
  font-family: $font-principal;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: $primary;
    color: $primary;
  }
}

.hero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 20px;
  margin-bottom: 16px;

  &--skeleton {
    align-items: center;
  }

  &__avatar {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--accent-soft);
    color: $primary;
    font-size: 1rem;
    font-weight: 800;
  }

  &__info {
    flex: 1;
    min-width: 0;

    h1 {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
  }

  &__id,
  &__dir,
  &__vendedor {
    margin-top: 3px;
    font-family: $font-secondary;
    font-size: 0.78rem;
    color: var(--text-soft);

    b {
      color: var(--text);
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;

    a, button {
      text-align: center;
      padding: 8px 22px;
      border-radius: 8px;
      background: var(--accent-soft);
      color: $primary;
      font-family: $font-secondary;
      font-size: 0.78rem;
      font-weight: 700;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: rgba($primary, 0.2);
      }
    }

    .is-cobro {
      background: $secondary;
      color: $white;

      &:hover {
        background: darken($secondary, 6%);
      }
    }

    .is-pedido {
      background: $primary;
      color: $white;

      &:hover {
        background: darken($primary, 6%);
      }
    }
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;

    &__actions {
      flex-direction: row;
      width: 100%;

      a {
        flex: 1;
      }
    }
  }
}

.bloque {
  margin-bottom: 20px;
}

.seccion {
  font-size: 0.95rem;
  font-weight: 800;
  margin-bottom: 12px;

  small {
    font-family: $font-secondary;
    font-size: 0.72rem;
    font-weight: 600;
    color: $primary;
    background: var(--accent-soft);
    border-radius: 999px;
    padding: 2px 8px;
    margin-left: 6px;
  }
}

.no-encontrado {
  text-align: center;
  padding: 60px 20px;
  font-family: $font-secondary;
  font-size: 0.85rem;
  color: var(--text-soft);

  a {
    display: inline-block;
    margin-top: 12px;
    color: $primary;
    font-weight: 700;
  }
}
</style>
