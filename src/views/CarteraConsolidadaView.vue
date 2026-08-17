<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useErpStore } from '@/stores/erp'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTable, { type Column } from '@/components/ui/DataTable.vue'
import { formatMoney, initials } from '@/utils/format'

const erp = useErpStore()
onMounted(() => erp.fetchCarteraConsolidada())

const total = computed(() =>
  erp.carteraConsolidada.data.reduce((sum, r) => sum + Number(r.deuda_total || 0), 0),
)

const maxDeuda = computed(() =>
  erp.carteraConsolidada.data.reduce((max, r) => Math.max(max, Number(r.deuda_total || 0)), 1),
)

const columns: Column[] = [
  { key: 'per_codigo', label: 'Código', width: '90px', sortable: true },
  { key: 'per_nombre', label: 'Cliente', sortable: true },
  { key: 'deuda_total', label: 'Deuda total', align: 'right', sortable: true },
]

const count = computed(() =>
  erp.carteraConsolidada.fetchedAt ? erp.carteraConsolidada.data.length : null,
)
</script>

<template>
  <div>
    <PageHeader
      title="Cartera · Consolidada"
      subtitle="Deuda total agrupada por cliente"
      source="erp"
      :count="count"
      :refreshing="erp.carteraConsolidada.loading && !!erp.carteraConsolidada.fetchedAt"
      @refresh="erp.fetchCarteraConsolidada(true)"
    >
      <template #actions>
        <span class="total">
          Cartera total
          <strong>{{ formatMoney(total) }}</strong>
        </span>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="erp.carteraConsolidada.data"
      :loading="erp.carteraConsolidada.loading && !erp.carteraConsolidada.fetchedAt"
      :error="erp.carteraConsolidada.error"
      :search-keys="['per_nombre', 'per_codigo']"
      search-placeholder="Buscar cliente…"
      :page-size="12"
      @retry="erp.fetchCarteraConsolidada(true)"
    >
      <template #cell-per_nombre="{ row }">
        <div class="debtor">
          <span class="debtor__avatar">{{ initials(row.per_nombre) }}</span>
          <div class="debtor__info">
            <strong>{{ row.per_nombre }}</strong>
            <span class="debtor__bar">
              <i :style="{ width: `${(Number(row.deuda_total) / maxDeuda) * 100}%` }" />
            </span>
          </div>
        </div>
      </template>

      <template #cell-deuda_total="{ value }">
        <strong class="amount">{{ formatMoney(value) }}</strong>
      </template>

      <template #mobile-card="{ row }">
        <div class="mcard">
          <div class="mcard__head">
            <strong>{{ row.per_nombre }}</strong>
            <b>{{ formatMoney(row.deuda_total) }}</b>
          </div>
          <span class="debtor__bar">
            <i :style="{ width: `${(Number(row.deuda_total) / maxDeuda) * 100}%` }" />
          </span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
.total {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border-radius: 10px;
  background: $alert-warning-bg;
  font-family: $font-secondary;
  font-size: 0.76rem;
  font-weight: 600;
  color: darken($alert-warning, 22%);

  strong {
    font-size: 0.95rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
}

.debtor {
  display: flex;
  align-items: center;
  gap: 10px;

  &__avatar {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    flex-shrink: 0;
    background: $alert-warning-bg;
    color: darken($alert-warning, 15%);
    font-family: $font-principal;
    font-size: 0.66rem;
    font-weight: 800;
  }

  &__info {
    flex: 1;
    min-width: 0;
    max-width: 420px;

    strong {
      display: block;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__bar {
    display: block;
    height: 4px;
    margin-top: 5px;
    border-radius: 4px;
    background: rgba($primary-dark, 0.06);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, $alert-warning, $alert-error);
      transition: width 0.6s var(--ease-out);
    }
  }
}

.amount {
  font-weight: 700;
}

.mcard {
  font-family: $font-secondary;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;

    strong {
      font-size: 0.82rem;
      font-weight: 600;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    b {
      font-size: 0.86rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  }
}
</style>
