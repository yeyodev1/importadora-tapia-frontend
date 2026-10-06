<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useErpStore } from '@/stores/erp'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

/** Bodega del usuario de bodega: todas (como Josué) o una sola (ej. Quito). Botones, sin <select>. */
const model = defineModel<string>({ required: true })

const erp = useErpStore()
onMounted(() => erp.fetchInventario())

/** Bodegas del ERP (bod_nombre del inventario, igual que en la asignación de vendedores). */
const bodegas = computed(() => {
  const set = new Set(erp.inventario.data.map((i) => i.bod_nombre).filter(Boolean))
  if (model.value) set.add(model.value)
  return [...set].sort()
})
</script>

<template>
  <div class="bods">
    <button
      type="button"
      class="bod"
      :class="{ 'is-on': model === '' }"
      :aria-pressed="model === ''"
      @click="model = ''"
    >
      <i class="fa-solid fa-warehouse" aria-hidden="true"></i>
      <span><strong>Todas las bodegas</strong><small>Ve y despacha todos los pedidos</small></span>
    </button>
    <p v-if="erp.inventario.loading && !bodegas.length" class="bods__estado"><BaseSpinner :size="12" /> Cargando bodegas…</p>
    <button
      v-for="b in bodegas"
      :key="b"
      type="button"
      class="bod"
      :class="{ 'is-on': model === b }"
      :aria-pressed="model === b"
      @click="model = b"
    >
      <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
      <span><strong>{{ b }}</strong><small>Solo los pedidos de esta bodega</small></span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.bods { display: flex; flex-direction: column; gap: 8px;
  &__estado { display: flex; align-items: center; gap: 6px; font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); }
  @media (min-width: 560px) { flex-direction: row; flex-wrap: wrap; > .bod { flex: 1 1 180px; } }
}
.bod {
  display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 10px 12px; text-align: left;
  border: 1.5px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--text); cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  > i { color: var(--text-faint); }
  span { display: flex; flex-direction: column; min-width: 0; }
  strong { font-size: 0.82rem; font-weight: 800; }
  small { font-family: $font-secondary; font-size: 0.68rem; color: var(--text-soft); }
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: var(--accent-soft); > i { color: $primary; } }
}
</style>
