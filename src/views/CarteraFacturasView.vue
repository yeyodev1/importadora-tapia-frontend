<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useErpStore } from '@/stores/erp'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable, { type Column } from '@/components/ui/DataTable.vue'
import { formatMoney, formatDate } from '@/utils/format'

const erp = useErpStore()
onMounted(() => erp.fetchCarteraFacturas())

const estado = ref<'todas' | 'VIGENTE' | 'VENCIDO'>('todas')

const rows = computed(() =>
  estado.value === 'todas'
    ? erp.carteraFacturas.data
    : erp.carteraFacturas.data.filter((f) => f.estado_factura === estado.value),
)

const saldoFiltrado = computed(() =>
  rows.value.reduce((sum, f) => sum + Number(f.saldo_pendiente || 0), 0),
)

const columns: Column[] = [
  { key: 'per_nombre', label: 'Cliente', sortable: true },
  { key: 'documento', label: 'Documento' },
  { key: 'trc_fecha', label: 'Emisión', sortable: true },
  { key: 'fecha_vencimiento', label: 'Vencimiento', sortable: true },
  { key: 'trc_totfact', label: 'Total', align: 'right', sortable: true },
  { key: 'total_abonado', label: 'Abonado', align: 'right' },
  { key: 'saldo_pendiente', label: 'Saldo', align: 'right', sortable: true },
  { key: 'estado_factura', label: 'Estado', align: 'center' },
]

const count = computed(() => (erp.carteraFacturas.fetchedAt ? rows.value.length : null))
</script>

<template>
  <div>
    <PageHeader
      title="Cartera · Facturas"
      subtitle="Facturas de los últimos 2 años con su saldo"
      source="erp"
      :count="count"
      :refreshing="erp.carteraFacturas.loading && !!erp.carteraFacturas.fetchedAt"
      @refresh="erp.fetchCarteraFacturas(true)"
    >
      <template #actions>
        <div class="filters">
          <button
            v-for="opt in ['todas', 'VIGENTE', 'VENCIDO'] as const"
            :key="opt"
            type="button"
            class="filters__btn"
            :class="{ 'is-active': estado === opt, 'is-danger': opt === 'VENCIDO' }"
            @click="estado = opt"
          >
            {{ opt === 'todas' ? 'Todas' : opt === 'VIGENTE' ? 'Vigentes' : 'Vencidas' }}
          </button>
          <span class="filters__total">
            Saldo: <strong>{{ formatMoney(saldoFiltrado) }}</strong>
          </span>
        </div>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="erp.carteraFacturas.loading && !erp.carteraFacturas.fetchedAt"
      :error="erp.carteraFacturas.error"
      :search-keys="['per_nombre', 'trc_numdoc', 'trc_serdoc']"
      search-placeholder="Buscar por cliente o número de documento…"
      :page-size="12"
      @retry="erp.fetchCarteraFacturas(true)"
    >
      <template #cell-per_nombre="{ row }">
        <div class="invoice-client">
          <strong>{{ row.per_nombre }}</strong>
          <small v-if="Number(row.per_diascredito) > 0">{{ row.per_diascredito }} días de crédito</small>
        </div>
      </template>

      <template #cell-documento="{ row }">
        <code class="doc">{{ row.trc_serdoc }}-{{ row.trc_numdoc }}</code>
      </template>

      <template #cell-trc_fecha="{ value }">{{ formatDate(value) }}</template>
      <template #cell-fecha_vencimiento="{ value }">{{ formatDate(value) }}</template>
      <template #cell-trc_totfact="{ value }">{{ formatMoney(value) }}</template>
      <template #cell-total_abonado="{ value }">{{ formatMoney(value) }}</template>

      <template #cell-saldo_pendiente="{ value }">
        <strong class="saldo" :class="{ 'is-zero': Number(value) === 0 }">
          {{ formatMoney(value) }}
        </strong>
      </template>

      <template #cell-estado_factura="{ value }">
        <BaseBadge :tone="value === 'VENCIDO' ? 'danger' : 'success'">
          {{ value === 'VENCIDO' ? 'Vencida' : 'Vigente' }}
        </BaseBadge>
      </template>

      <template #mobile-card="{ row }">
        <div class="mcard">
          <div class="mcard__head">
            <strong>{{ row.per_nombre }}</strong>
            <BaseBadge :tone="row.estado_factura === 'VENCIDO' ? 'danger' : 'success'">
              {{ row.estado_factura === 'VENCIDO' ? 'Vencida' : 'Vigente' }}
            </BaseBadge>
          </div>
          <p class="mcard__doc">
            <code class="doc">{{ row.trc_serdoc }}-{{ row.trc_numdoc }}</code>
            vence {{ formatDate(row.fecha_vencimiento) }}
          </p>
          <div class="mcard__amounts">
            <span>Total <b>{{ formatMoney(row.trc_totfact) }}</b></span>
            <span>Abonado <b>{{ formatMoney(row.total_abonado) }}</b></span>
            <span class="is-saldo">Saldo <b>{{ formatMoney(row.saldo_pendiente) }}</b></span>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
.filters {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  &__btn {
    padding: 7px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 999px;
    background: var(--surface);
    font-family: $font-secondary;
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--text-soft);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $primary;
      color: $primary;
    }

    &.is-active {
      background: $primary;
      border-color: $primary;
      color: $white;
    }

    &.is-danger.is-active {
      background: $alert-error;
      border-color: $alert-error;
    }
  }

  &__total {
    margin-left: 8px;
    font-family: $font-secondary;
    font-size: 0.76rem;
    color: var(--text-soft);

    strong {
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }
  }
}

.invoice-client {
  strong {
    display: block;
    font-weight: 600;
  }

  small {
    font-size: 0.68rem;
    color: var(--text-faint);
  }
}

.doc {
  font-family: $font-secondary;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-soft);
  background: rgba($primary-dark, 0.05);
  border-radius: 5px;
  padding: 2px 7px;
}

.saldo {
  font-weight: 700;

  &.is-zero {
    color: var(--text-faint);
    font-weight: 500;
  }
}

.mcard {
  font-family: $font-secondary;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    strong {
      font-size: 0.84rem;
      font-weight: 700;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__doc {
    margin-top: 6px;
    font-size: 0.74rem;
    color: var(--text-soft);
  }

  &__amounts {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 10px;
    font-size: 0.7rem;
    color: var(--text-faint);

    b {
      display: block;
      font-size: 0.82rem;
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }

    .is-saldo b {
      color: darken($alert-error, 8%);
    }
  }
}
</style>
