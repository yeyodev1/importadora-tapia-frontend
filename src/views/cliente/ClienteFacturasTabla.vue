<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable, { type Column } from '@/components/ui/DataTable.vue'
import { formatMoney, formatDate, formatNumFactura } from '@/utils/format'
import { tienePlazo, estadoCartera, ESTADO_CARTERA_BADGE } from '@/utils/cartera'
import type { FacturaCartera } from '@/types/erp'

defineProps<{
  facturas: FacturaCartera[]
  loading: boolean
  error: string | null
}>()

defineEmits<{ retry: [] }>()

const columns: Column[] = [
  { key: 'documento', label: 'N° factura' },
  { key: 'trc_fecha', label: 'Emisión', sortable: true },
  { key: 'fecha_vencimiento', label: 'Vencimiento', sortable: true },
  { key: 'trc_totfact', label: 'Total', align: 'right', sortable: true },
  { key: 'saldo_pendiente', label: 'Saldo', align: 'right', sortable: true },
  { key: 'estado_factura', label: 'Estado', align: 'center' },
]
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="facturas"
    :loading="loading"
    :error="error"
    :page-size="10"
    @retry="$emit('retry')"
  >
    <template #cell-documento="{ row }">
      <!-- Solo trc_numdoc: es el número que Tapia reconoce; trc_serdoc es una serie interna del ERP. -->
      <code class="doc">{{ formatNumFactura(row.trc_numdoc) }}</code>
    </template>
    <template #cell-trc_fecha="{ value }">{{ formatDate(value) }}</template>
    <!-- Sin días de crédito configurados el "vencimiento" del ERP es la misma fecha de emisión: no informar. -->
    <template #cell-fecha_vencimiento="{ row, value }">
      {{ tienePlazo(row) ? formatDate(value) : '—' }}
    </template>
    <template #cell-trc_totfact="{ value }">{{ formatMoney(value) }}</template>
    <template #cell-saldo_pendiente="{ value }">
      <b :class="{ 'sin-saldo': Number(value) === 0 }">{{ formatMoney(value) }}</b>
    </template>
    <template #cell-estado_factura="{ row }">
      <BaseBadge :tone="ESTADO_CARTERA_BADGE[estadoCartera(row)].tone">
        {{ ESTADO_CARTERA_BADGE[estadoCartera(row)].label }}
      </BaseBadge>
    </template>

    <template #mobile-card="{ row }">
      <div class="fmcard">
        <div class="fmcard__head">
          <code class="doc">{{ formatNumFactura(row.trc_numdoc) }}</code>
          <BaseBadge :tone="ESTADO_CARTERA_BADGE[estadoCartera(row)].tone">
            {{ ESTADO_CARTERA_BADGE[estadoCartera(row)].label }}
          </BaseBadge>
        </div>
        <p>
          <template v-if="tienePlazo(row)">Vence {{ formatDate(row.fecha_vencimiento) }}</template>
          <template v-else>Emitida {{ formatDate(row.trc_fecha) }}</template>
          · Total {{ formatMoney(row.trc_totfact) }}
        </p>
        <b>Saldo {{ formatMoney(row.saldo_pendiente) }}</b>
      </div>
    </template>
  </DataTable>
</template>

<style lang="scss" scoped>
.doc {
  font-family: $font-secondary;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-soft);
  background: rgba($primary-dark, 0.05);
  border-radius: 5px;
  padding: 2px 7px;
}

.sin-saldo {
  color: var(--text-faint);
  font-weight: 500;
}

.fmcard {
  font-family: $font-secondary;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  p {
    margin-top: 6px;
    font-size: 0.74rem;
    color: var(--text-soft);
  }

  b {
    display: block;
    margin-top: 4px;
    font-size: 0.84rem;
    font-variant-numeric: tabular-nums;
  }
}
</style>
