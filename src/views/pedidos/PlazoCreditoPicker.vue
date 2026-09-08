<script setup lang="ts">
/**
 * Plazo de crédito del pedido (obligatorio). Chips con estilos propios, sin
 * <select> nativo. null = todavía no elegido.
 */
const model = defineModel<number | null>({ required: true })

const OPCIONES: { dias: number; label: string }[] = [
  { dias: 0, label: 'Contado' },
  { dias: 8, label: '8 días' },
  { dias: 15, label: '15 días' },
  { dias: 30, label: '30 días' },
  { dias: 45, label: '45 días' },
  { dias: 60, label: '60 días' },
]
</script>

<template>
  <div class="plazo" role="radiogroup" aria-label="Plazo de crédito">
    <button
      v-for="o in OPCIONES"
      :key="o.dias"
      type="button"
      role="radio"
      class="plazo__chip"
      :class="{ 'is-active': model === o.dias, 'is-contado': o.dias === 0 }"
      :aria-checked="model === o.dias"
      @click="model = o.dias"
    >
      <i v-if="o.dias === 0" class="fa-solid fa-money-bill-wave"></i>
      <i v-else class="fa-regular fa-calendar"></i>
      {{ o.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.plazo {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 calc(33.333% - 8px);
    min-height: 42px;
    padding: 0 12px;
    border: 1.5px solid var(--border-strong);
    border-radius: 999px;
    background: var(--surface);
    font-family: $font-secondary;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;

    @media (min-width: 560px) { flex: 0 0 auto; }

    i { color: var(--text-faint); font-size: 0.78rem; }
    &:hover { border-color: $primary; }

    &.is-active {
      border-color: $primary;
      background: $primary;
      color: $white;
      i { color: $white; }
    }

    &.is-contado.is-active {
      border-color: $secondary;
      background: $secondary;
    }
  }
}
</style>
