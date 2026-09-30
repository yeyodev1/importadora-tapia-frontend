<script setup lang="ts">
/** Filtros rápidos de Despachos: fecha, bodega y orden. Todo con un toque, sin menús. */
export type Rango = 'todos' | 'hoy' | 'ayer' | 'semana' | 'mes'

defineProps<{ bodegas: string[]; hayFiltros: boolean }>()
const rango = defineModel<Rango>('rango', { required: true })
const bodega = defineModel<string>('bodega', { required: true })
const recientes = defineModel<boolean>('recientes', { required: true })
const emit = defineEmits<{ limpiar: [] }>()

const RANGOS: { v: Rango; label: string }[] = [
  { v: 'todos', label: 'Todas las fechas' },
  { v: 'hoy', label: 'Hoy' },
  { v: 'ayer', label: 'Ayer' },
  { v: 'semana', label: 'Últimos 7 días' },
  { v: 'mes', label: 'Este mes' },
]
</script>

<template>
  <div class="filtros">
    <div class="fila" role="group" aria-label="Filtrar por fecha">
      <i class="fa-solid fa-calendar-day fila__ico" aria-hidden="true"></i>
      <button
        v-for="r in RANGOS"
        :key="r.v"
        type="button"
        class="chip"
        :class="{ 'is-on': rango === r.v }"
        :aria-pressed="rango === r.v"
        @click="rango = r.v"
      >{{ r.label }}</button>
    </div>

    <div class="fila">
      <template v-if="bodegas.length > 1">
        <i class="fa-solid fa-warehouse fila__ico" aria-hidden="true"></i>
        <button type="button" class="chip" :class="{ 'is-on': bodega === '' }" :aria-pressed="bodega === ''" @click="bodega = ''">Todas las bodegas</button>
        <button
          v-for="b in bodegas"
          :key="b"
          type="button"
          class="chip"
          :class="{ 'is-on': bodega === b }"
          :aria-pressed="bodega === b"
          @click="bodega = b"
        >{{ b }}</button>
      </template>
      <button type="button" class="chip is-orden" :aria-label="recientes ? 'Orden: más recientes primero' : 'Orden: más antiguos primero'" @click="recientes = !recientes">
        <i class="fa-solid" :class="recientes ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-short-wide'" aria-hidden="true"></i>
        {{ recientes ? 'Más recientes primero' : 'Más antiguos primero' }}
      </button>
      <button v-if="hayFiltros" type="button" class="limpiar" @click="emit('limpiar')">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i> Quitar filtros
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filtros { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.fila {
  display: flex; align-items: center; gap: 8px; overflow-x: auto; padding-bottom: 2px;
  &__ico { flex-shrink: 0; color: var(--text-faint); font-size: 0.85rem; }
}
.chip {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 7px 14px;
  border: 1.5px solid var(--border-strong); border-radius: 999px; background: var(--surface); cursor: pointer;
  font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; color: var(--text); white-space: nowrap;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: $primary; color: $white; }
  &.is-orden { margin-left: auto; i { color: $primary; } }
}
.limpiar {
  flex-shrink: 0; background: none; border: none; padding: 6px 4px; cursor: pointer; white-space: nowrap;
  font-family: $font-secondary; font-size: 0.76rem; font-weight: 700; color: $alert-error;
  &:hover { text-decoration: underline; }
}
</style>
