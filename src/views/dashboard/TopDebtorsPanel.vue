<script setup lang="ts">
import type { CarteraConsolidada } from '@/types/erp'
import { formatMoney, initials } from '@/utils/format'
import SourceTag from '@/components/ui/SourceTag.vue'

const props = defineProps<{
  debtors: CarteraConsolidada[]
  loading: boolean
}>()

const maxDeuda = () => Number(props.debtors[0]?.deuda_total || 1)
</script>

<template>
  <article class="panel">
    <header class="panel__head">
      <h2>Mayores deudores <SourceTag source="erp" /></h2>
      <RouterLink to="/cartera/consolidada">Ver cartera</RouterLink>
    </header>

    <div v-if="loading" class="panel__skeleton">
      <span v-for="i in 6" :key="i" class="skeleton" />
    </div>

    <ul v-else class="debtors">
      <li
        v-for="(d, i) in debtors"
        :key="d.per_codigo"
        class="stagger-item"
        :style="{ '--i': i }"
      >
        <span class="debtors__avatar">{{ initials(d.per_nombre) }}</span>
        <div class="debtors__info">
          <strong>{{ d.per_nombre }}</strong>
          <span class="debtors__bar">
            <i :style="{ width: `${(Number(d.deuda_total) / maxDeuda()) * 100}%` }" />
          </span>
        </div>
        <span class="debtors__amount">{{ formatMoney(d.deuda_total) }}</span>
      </li>
    </ul>
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
}

.debtors {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--accent-soft);
    color: $primary;
    font-size: 0.7rem;
    font-weight: 800;
  }

  &__info {
    flex: 1;
    min-width: 0;

    strong {
      display: block;
      font-family: $font-secondary;
      font-size: 0.8rem;
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

  &__amount {
    font-family: $font-secondary;
    font-size: 0.8rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}
</style>
