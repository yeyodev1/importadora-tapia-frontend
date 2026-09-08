<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import type { Vendedor } from '@/types/erp'

/**
 * Lista de vendedores del ERP para vincular a una cuenta. Muestra el estado
 * de carga del ERP y permite filtrar por nombre cuando son muchos.
 */
const props = defineProps<{
  vendedores: Vendedor[]
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{ retry: [] }>()

const model = defineModel<string>({ required: true })
const filtro = ref('')

const visibles = computed(() => {
  const q = filtro.value.trim().toLowerCase()
  if (!q) return props.vendedores
  return props.vendedores.filter(
    (v) => v.ven_nombre.toLowerCase().includes(q) || v.ven_codigo.includes(q),
  )
})
</script>

<template>
  <div class="vp">
    <p v-if="loading && !vendedores.length" class="vp__estado">
      <BaseSpinner :size="12" /> Cargando vendedores del ERP…
    </p>
    <p v-else-if="error" class="vp__estado is-error">
      No se pudo leer la lista del ERP: {{ error }}
      <button type="button" class="vp__link" @click="emit('retry')">Reintentar</button>
    </p>
    <p v-else-if="!vendedores.length" class="vp__estado">
      Todos los vendedores del ERP ya tienen su cuenta.
    </p>

    <template v-else>
      <input
        v-if="vendedores.length > 6"
        v-model="filtro"
        type="search"
        class="vp__filtro"
        placeholder="Buscar vendedor por nombre o código…"
        aria-label="Buscar vendedor"
      />
      <div class="vp__lista">
        <button
          v-for="v in visibles"
          :key="v.ven_codigo"
          type="button"
          class="vend"
          :class="{ 'is-active': model === v.ven_codigo }"
          :aria-pressed="model === v.ven_codigo"
          @click="model = v.ven_codigo"
        >
          <span class="vend__code">{{ v.ven_codigo }}</span>
          <span class="vend__name">{{ v.ven_nombre }}</span>
          <i v-if="model === v.ven_codigo" class="fa-solid fa-check"></i>
        </button>
        <p v-if="!visibles.length" class="vp__estado">Ningún vendedor coincide con "{{ filtro }}".</p>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.vp {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__estado {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-family: $font-secondary;
    font-size: 0.78rem;
    color: var(--text-soft);
    &.is-error { color: darken($alert-error, 8%); }
  }

  &__link {
    background: none;
    border: none;
    padding: 0;
    color: $primary;
    font: inherit;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }

  &__filtro {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    font-family: $font-secondary;
    font-size: 0.82rem;
    color: var(--text);
    background: var(--surface);
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
  }

  &__lista {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 230px;
    overflow-y: auto;
    padding-right: 2px;
  }
}

.vend {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &__code {
    flex-shrink: 0;
    min-width: 34px;
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba($primary-dark, 0.06);
    font-family: $font-secondary;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-soft);
    text-align: center;
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  i { color: $primary; }
  &:hover { border-color: $primary; }
  &.is-active { border-color: $primary; background: var(--accent-soft); }
}
</style>
