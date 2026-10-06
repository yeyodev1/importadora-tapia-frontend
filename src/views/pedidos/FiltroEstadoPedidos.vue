<script setup lang="ts">
import type { EstadoPedido } from '@/types/erp'

/** Chips de estado con su conteo: un toque y se filtra la lista (sin menús ni select). */
export type FiltroEstado = 'todos' | EstadoPedido

defineProps<{ conteo: Record<FiltroEstado, number> }>()
const model = defineModel<FiltroEstado>({ required: true })

// "Todos" y enseguida lo que pide acción (sin aprobación, en espera); luego lo ya resuelto.
const CHIPS: { v: FiltroEstado; label: string; tono: string }[] = [
  { v: 'todos', label: 'Todos', tono: '' },
  { v: 'enviado', label: 'Sin aprobación', tono: 'is-info' },
  { v: 'en_espera', label: 'En espera', tono: 'is-aviso' },
  { v: 'aprobado', label: 'Aprobados', tono: 'is-ok' },
  { v: 'rechazado', label: 'Rechazados', tono: 'is-peligro' },
]
</script>

<template>
  <div class="chips" role="tablist" aria-label="Filtrar pedidos por estado">
    <button
      v-for="c in CHIPS"
      :key="c.v"
      type="button"
      role="tab"
      class="chip"
      :class="[c.tono, { 'is-on': model === c.v, 'is-vacio': !conteo[c.v] }]"
      :aria-selected="model === c.v"
      @click="model = c.v"
    >
      {{ c.label }}
      <span class="chip__n">{{ conteo[c.v] }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.chips {
  display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 4px;
  -webkit-overflow-scrolling: touch; scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  @media (min-width: 720px) { flex-wrap: wrap; overflow-x: visible; }
}
.chip {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 7px 8px 7px 14px;
  border: 1.5px solid var(--border-strong); border-radius: 999px; background: var(--surface);
  font-family: $font-principal; font-size: 0.78rem; font-weight: 700; color: var(--text); cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  &__n { min-width: 24px; padding: 2px 7px; border-radius: 999px; background: var(--accent-soft); color: $primary;
    font-size: 0.72rem; font-weight: 800; text-align: center; font-variant-numeric: tabular-nums; }
  &.is-vacio .chip__n { background: rgba($primary-dark, 0.06); color: var(--text-faint); }
  &.is-aviso:not(.is-vacio) .chip__n { background: $alert-warning-bg; color: darken($alert-warning, 25%); }
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: var(--accent-soft); color: $primary; }
  &.is-on.is-aviso { border-color: $alert-warning; background: $alert-warning-bg; color: darken($alert-warning, 25%); }
  &.is-on.is-ok { border-color: $secondary; background: rgba($secondary, 0.1); color: darken($secondary, 14%); }
  &.is-on.is-peligro { border-color: $alert-error; background: $alert-error-bg; color: darken($alert-error, 6%); }
}
</style>
