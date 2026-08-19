<script setup lang="ts">
/**
 * Etiqueta de procedencia del dato, para que en cualquier pantalla quede claro
 * de dónde viene la información: del ERP de Importadora Tapia (solo lectura)
 * o registrada en este CRM. Con hora de la última lectura cuando se conoce.
 */
const props = withDefaults(
  defineProps<{
    source?: 'erp' | 'local'
    /** timestamp (ms) de la última lectura de los datos, ej. fetchedAt del store */
    updatedAt?: number | null
  }>(),
  { source: 'erp', updatedAt: null },
)

function hora(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

const descripcion =
  props.source === 'erp'
    ? 'Dato leído del sistema (ERP) de Importadora Tapia. Aquí solo se consulta; cualquier cambio se hace en ese sistema.'
    : 'Dato creado y administrado en esta aplicación por el equipo.'
</script>

<template>
  <span class="srctag" :class="`is-${source}`" role="note" :aria-label="descripcion" :title="descripcion">
    <i :class="source === 'erp' ? 'fa-solid fa-database' : 'fa-solid fa-pen-to-square'" aria-hidden="true"></i>
    {{ source === 'erp' ? 'Fuente: ERP Tapia' : 'Registrado en el CRM' }}
    <template v-if="updatedAt"> · {{ hora(updatedAt) }}</template>
  </span>
</template>

<style lang="scss" scoped>
.srctag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: $font-secondary;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 999px;
  padding: 3px 10px;
  cursor: help;
  white-space: nowrap;

  i {
    font-size: 0.6rem;
  }

  &.is-erp {
    color: rgba($primary-dark, 0.6);
    background: rgba($primary-dark, 0.06);
  }

  &.is-local {
    color: darken($secondary, 14%);
    background: rgba($secondary, 0.12);
  }
}
</style>
