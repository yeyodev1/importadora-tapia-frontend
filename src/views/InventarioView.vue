<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useErpStore } from '@/stores/erp'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable, { type Column } from '@/components/ui/DataTable.vue'
import { formatQty } from '@/utils/format'

const erp = useErpStore()
onMounted(() => erp.fetchInventario())

const bodega = ref('todas')

const bodegas = computed(() => {
  const set = new Set(erp.inventario.data.map((i) => i.bod_nombre))
  return [...set].sort()
})

const rows = computed(() =>
  bodega.value === 'todas'
    ? erp.inventario.data
    : erp.inventario.data.filter((i) => i.bod_nombre === bodega.value),
)

const columns: Column[] = [
  { key: 'pro_codigo', label: 'Código', width: '90px', sortable: true },
  { key: 'pro_nombre', label: 'Producto', sortable: true },
  { key: 'uni_nombre', label: 'Unidad' },
  { key: 'bod_nombre', label: 'Bodega', sortable: true },
  { key: 'stock_actual', label: 'Stock', align: 'right', sortable: true },
]

const count = computed(() => (erp.inventario.fetchedAt ? rows.value.length : null))

function stockTone(value: string): 'danger' | 'warning' | 'success' {
  const n = Number(value)
  if (n <= 0) return 'danger'
  if (n < 10) return 'warning'
  return 'success'
}

function stockLabel(value: string): string {
  const n = Number(value)
  if (n <= 0) return 'Sin stock'
  if (n < 10) return 'Bajo'
  return 'Disponible'
}
</script>

<template>
  <div>
    <PageHeader
      title="Inventario"
      subtitle="Existencias por producto y bodega"
      source="erp"
      :count="count"
      :refreshing="erp.inventario.loading && !!erp.inventario.fetchedAt"
      @refresh="erp.fetchInventario(true)"
    >
      <template #actions>
        <div class="chips">
          <button
            type="button"
            class="chips__chip"
            :class="{ 'is-active': bodega === 'todas' }"
            @click="bodega = 'todas'"
          >
            Todas
          </button>
          <button
            v-for="b in bodegas"
            :key="b"
            type="button"
            class="chips__chip"
            :class="{ 'is-active': bodega === b }"
            @click="bodega = b"
          >
            {{ b.replace('Bodega ', '') }}
          </button>
        </div>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="erp.inventario.loading && !erp.inventario.fetchedAt"
      :error="erp.inventario.error"
      :search-keys="['pro_nombre', 'pro_codigo', 'bod_nombre']"
      search-placeholder="Buscar producto o bodega…"
      :page-size="12"
      @retry="erp.fetchInventario(true)"
    >
      <template #cell-pro_nombre="{ value }">
        <strong class="product">{{ value }}</strong>
      </template>

      <template #cell-stock_actual="{ value }">
        <div class="stock">
          <span class="stock__qty">{{ formatQty(value) }}</span>
          <BaseBadge :tone="stockTone(value)">{{ stockLabel(value) }}</BaseBadge>
        </div>
      </template>

      <template #mobile-card="{ row }">
        <div class="mcard">
          <div class="mcard__head">
            <strong>{{ row.pro_nombre }}</strong>
            <BaseBadge :tone="stockTone(row.stock_actual)">{{ stockLabel(row.stock_actual) }}</BaseBadge>
          </div>
          <p class="mcard__meta">
            {{ row.bod_nombre }} · {{ row.uni_nombre }} ·
            <b>{{ formatQty(row.stock_actual) }}</b> en stock
          </p>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
.chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  &__chip {
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
      box-shadow: 0 3px 10px rgba($primary, 0.3);
    }
  }
}

.product {
  font-weight: 600;
}

.stock {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;

  &__qty {
    font-weight: 700;
    min-width: 46px;
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
    }
  }

  &__meta {
    margin-top: 6px;
    font-size: 0.76rem;
    color: var(--text-soft);

    b {
      color: var(--text);
    }
  }
}
</style>
