<script setup lang="ts">
import type { FacturaCartera } from '@/types/erp'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { formatMoney, formatNumFactura } from '@/utils/format'

defineProps<{
  invoices: FacturaCartera[]
  loading: boolean
}>()

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}
</script>

<template>
  <article class="panel">
    <header class="panel__head">
      <h2>Próximas a vencer</h2>
      <RouterLink to="/cartera/facturas">Ver facturas</RouterLink>
    </header>

    <div v-if="loading" class="panel__skeleton">
      <span v-for="i in 6" :key="i" class="skeleton" />
    </div>

    <ul v-else-if="invoices.length" class="invoices">
      <li
        v-for="(f, i) in invoices"
        :key="f.trc_codigo"
        class="stagger-item"
        :style="{ '--i': i }"
      >
        <div>
          <strong>{{ f.per_nombre }}</strong>
          <small>
            Factura {{ formatNumFactura(f.trc_numdoc) }} · vence {{ shortDate(f.fecha_vencimiento) }}
          </small>
        </div>
        <div class="invoices__right">
          <span>{{ formatMoney(f.saldo_pendiente) }}</span>
          <BaseBadge tone="info">Vigente</BaseBadge>
        </div>
      </li>
    </ul>

    <p v-else class="panel__empty">No hay facturas vigentes con saldo pendiente.</p>
  </article>
</template>

<style lang="scss" scoped>
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 18px 20px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;

    h2 {
      font-size: 0.95rem;
      font-weight: 800;
    }

    a {
      font-family: $font-secondary;
      font-size: 0.75rem;
      font-weight: 600;
      color: $primary;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: 14px;

    .skeleton {
      height: 16px;
    }
  }

  &__empty {
    font-family: $font-secondary;
    font-size: 0.8rem;
    color: var(--text-faint);
    padding: 20px 0;
  }
}

.invoices {
  list-style: none;
  display: flex;
  flex-direction: column;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);

    &:last-child {
      border-bottom: none;
    }

    strong {
      display: block;
      font-family: $font-secondary;
      font-size: 0.8rem;
      font-weight: 600;
    }

    small {
      font-family: $font-secondary;
      font-size: 0.7rem;
      color: var(--text-faint);
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;

    span {
      font-family: $font-secondary;
      font-size: 0.8rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }
}
</style>
