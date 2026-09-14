<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useErpStore } from '@/stores/erp'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable, { type Column } from '@/components/ui/DataTable.vue'
import { formatQty } from '@/utils/format'
import { erpService } from '@/services/erp.service'
import { useUserStore } from '@/stores/user'
import type { AsignacionInventario } from '@/types/erp'

const erp = useErpStore()
const userStore = useUserStore()
const asignacion = ref<AsignacionInventario | null>(null)

onMounted(async () => {
  erp.fetchInventario()
  if (userStore.isVendedor) {
    try {
      asignacion.value = await erpService.miAsignacionInventario()
    } catch {
      asignacion.value = null
    }
  }
})

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
  { key: 'solo_contado', label: 'Venta', align: 'center' },
]

/** Admin: marcar/desmarcar "solo contado" (aplica a todas las bodegas del producto). */
const guardandoRegla = ref<string | null>(null)
async function toggleSoloContado(row: { pro_codigo: string; pro_nombre: string; solo_contado?: boolean }) {
  if (!userStore.isAdmin || guardandoRegla.value) return
  guardandoRegla.value = row.pro_codigo
  try {
    const r = await erpService.guardarReglaProducto(row.pro_codigo, { soloContado: !row.solo_contado, proNombre: row.pro_nombre })
    for (const i of erp.inventario.data) if (i.pro_codigo === r.proCodigo) i.solo_contado = r.soloContado
  } finally {
    guardandoRegla.value = null
  }
}

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
    <p v-if="asignacion?.restringido" class="asignado">
      <i class="fa-solid fa-filter"></i>
      Ves solo el inventario que administración te asignó
      (<b>{{ asignacion.productos.length }}</b> producto{{ asignacion.productos.length === 1 ? '' : 's' }}).
    </p>

    <PageHeader
      title="Inventario"
      subtitle="Existencias por producto y bodega"
      source="erp"
      :updated-at="erp.inventario.fetchedAt"
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
      <template #cell-solo_contado="{ row }">
        <button
          v-if="userStore.isAdmin"
          type="button"
          class="contado-btn"
          :class="{ 'is-on': row.solo_contado }"
          :disabled="guardandoRegla === row.pro_codigo"
          :title="row.solo_contado ? 'Quitar la regla de solo contado' : 'Marcar como solo contado'"
          @click="toggleSoloContado(row)"
        >
          <i class="fa-solid" :class="row.solo_contado ? 'fa-money-bill-wave' : 'fa-handshake'"></i>
          {{ row.solo_contado ? 'Solo contado' : 'Crédito o contado' }}
        </button>
        <BaseBadge v-else :tone="row.solo_contado ? 'warning' : 'neutral'">
          {{ row.solo_contado ? 'Solo contado' : 'Crédito o contado' }}
        </BaseBadge>
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
          <button
            v-if="userStore.isAdmin"
            type="button"
            class="contado-btn"
            :class="{ 'is-on': row.solo_contado }"
            :disabled="guardandoRegla === row.pro_codigo"
            @click="toggleSoloContado(row)"
          >
            <i class="fa-solid" :class="row.solo_contado ? 'fa-money-bill-wave' : 'fa-handshake'"></i>
            {{ row.solo_contado ? 'Solo contado' : 'Crédito o contado' }}
          </button>
          <span v-else-if="row.solo_contado" class="contado-btn is-on"><i class="fa-solid fa-money-bill-wave"></i> Solo contado</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
.contado-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface);
  font-family: $font-secondary;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-soft);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  i { color: var(--text-faint); }
  &:hover { border-color: $primary; color: var(--text); }
  &.is-on { border-color: rgba($alert-warning, 0.7); background: $alert-warning-bg; color: darken($alert-warning, 25%); i { color: darken($alert-warning, 15%); } }
  &:disabled { opacity: 0.6; cursor: wait; }
}

.asignado {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--accent-soft);
  border: 1px solid rgba($primary, 0.2);
  font-family: $font-secondary;
  font-size: 0.78rem;
  color: var(--text-soft);
  i { color: $primary; }
  b { color: var(--text); }
}

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
