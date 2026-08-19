<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useErpStore } from '@/stores/erp'
import { useUserStore } from '@/stores/user'
import StatCard from '@/components/ui/StatCard.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TopDebtorsPanel from './dashboard/TopDebtorsPanel.vue'
import UpcomingInvoicesPanel from './dashboard/UpcomingInvoicesPanel.vue'
import { formatMoney } from '@/utils/format'
import { esVencida } from '@/utils/cartera'

const erp = useErpStore()
const userStore = useUserStore()

const subtitle = computed(() =>
  userStore.isAdmin
    ? 'Estado comercial en vivo desde el ERP'
    : `Tus clientes y tu cartera en vivo · ${userStore.name || ''}`,
)

function loadAll(force = false) {
  erp.fetchClientes(force)
  if (userStore.isAdmin) erp.fetchVendedores(force)
  erp.fetchInventario(force)
  erp.fetchCarteraFacturas(force)
  erp.fetchCarteraConsolidada(force)
}

onMounted(() => loadAll())

const refreshing = computed(
  () =>
    erp.clientes.loading ||
    erp.vendedores.loading ||
    erp.inventario.loading ||
    erp.carteraFacturas.loading ||
    erp.carteraConsolidada.loading,
)

const deudaTotal = computed(() =>
  erp.carteraConsolidada.data.reduce((sum, r) => sum + Number(r.deuda_total || 0), 0),
)

const vencidas = computed(() => erp.carteraFacturas.data.filter(esVencida))

const saldoVencido = computed(() =>
  vencidas.value.reduce((sum, f) => sum + Number(f.saldo_pendiente || 0), 0),
)

const topDeudores = computed(() =>
  [...erp.carteraConsolidada.data]
    .sort((a, b) => Number(b.deuda_total) - Number(a.deuda_total))
    .slice(0, 7),
)

const proximasVencer = computed(() =>
  [...erp.carteraFacturas.data]
    .filter((f) => !esVencida(f) && Number(f.saldo_pendiente) > 0)
    .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
    .slice(0, 6),
)

const money = (n: number) => formatMoney(n)
</script>

<template>
  <div>
    <PageHeader
      title="Resumen"
      :subtitle="subtitle"
      source="erp"
      :updated-at="erp.carteraFacturas.fetchedAt"
      :refreshing="refreshing"
      @refresh="loadAll(true)"
    />

    <section class="stats">
      <StatCard
        class="stagger-item"
        style="--i: 0"
        label="Clientes"
        :value="erp.clientes.fetchedAt ? erp.clientes.data.length : null"
        :loading="erp.clientes.loading"
        tone="accent"
      />
      <StatCard
        v-if="userStore.isAdmin"
        class="stagger-item"
        style="--i: 1"
        label="Vendedores"
        :value="erp.vendedores.fetchedAt ? erp.vendedores.data.length : null"
        :loading="erp.vendedores.loading"
        tone="positive"
      />
      <StatCard
        v-else
        class="stagger-item"
        style="--i: 1"
        label="Facturas con saldo"
        :value="
          erp.carteraFacturas.fetchedAt
            ? erp.carteraFacturas.data.filter((f) => Number(f.saldo_pendiente) > 0).length
            : null
        "
        :loading="erp.carteraFacturas.loading"
        tone="positive"
      />
      <StatCard
        class="stagger-item"
        style="--i: 2"
        label="Cartera total"
        :value="erp.carteraConsolidada.fetchedAt ? deudaTotal : null"
        :loading="erp.carteraConsolidada.loading"
        :format="money"
        tone="warning"
        :hint="`${erp.carteraConsolidada.data.length} clientes con saldo`"
      />
      <StatCard
        class="stagger-item"
        style="--i: 3"
        label="Saldo vencido"
        :value="erp.carteraFacturas.fetchedAt ? saldoVencido : null"
        :loading="erp.carteraFacturas.loading"
        :format="money"
        tone="danger"
        :hint="`${vencidas.length} facturas vencidas`"
      />
    </section>

    <section class="panels">
      <TopDebtorsPanel
        class="stagger-item"
        style="--i: 4"
        :debtors="topDeudores"
        :loading="erp.carteraConsolidada.loading"
      />
      <UpcomingInvoicesPanel
        class="stagger-item"
        style="--i: 5"
        :invoices="proximasVencer"
        :loading="erp.carteraFacturas.loading"
      />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.panels {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
}
</style>
