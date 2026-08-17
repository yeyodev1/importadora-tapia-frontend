<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: number | null
    loading?: boolean
    format?: (n: number) => string
    tone?: 'accent' | 'positive' | 'warning' | 'danger'
    hint?: string
  }>(),
  { loading: false, tone: 'accent', format: undefined, hint: '' },
)

const display = ref('0')
let raf = 0

/** Count-up: anima el número desde 0 al valor real en ~700ms. */
function animateTo(target: number) {
  cancelAnimationFrame(raf)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const fmt = props.format || ((n: number) => Math.round(n).toLocaleString('es-EC'))
  if (reduced) {
    display.value = fmt(target)
    return
  }
  const start = performance.now()
  const duration = 700
  const tick = (now: number) => {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = fmt(target * eased)
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

watch(
  () => props.value,
  (v) => {
    if (v !== null && Number.isFinite(v)) animateTo(v)
  },
  { immediate: true },
)

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <article class="stat" :class="`stat--${tone}`">
    <header class="stat__top">
      <span class="stat__label">{{ label }}</span>
      <span class="stat__mark" />
    </header>

    <div v-if="loading" class="stat__skeleton">
      <span class="skeleton" style="width: 70%; height: 26px" />
    </div>
    <p v-else class="stat__value">{{ display }}</p>

    <p v-if="hint && !loading" class="stat__hint">{{ hint }}</p>
  </article>
</template>

<style lang="scss" scoped>
.stat {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-pop);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__label {
    font-family: $font-secondary;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  &__mark {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &--accent &__mark { background: $primary; }
  &--positive &__mark { background: $secondary; }
  &--warning &__mark { background: $alert-warning; }
  &--danger &__mark { background: $alert-error; }

  &__value {
    margin-top: 10px;
    font-size: 1.7rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  &__skeleton {
    margin-top: 12px;
  }

  &__hint {
    margin-top: 4px;
    font-family: $font-secondary;
    font-size: 0.75rem;
    color: var(--text-faint);
  }
}
</style>
