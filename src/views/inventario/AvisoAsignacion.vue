<script setup lang="ts">
import type { AsignacionInventario } from '@/types/erp'

/** Le explica al vendedor qué parte del inventario ve: su bodega y, si aplica, sus productos. */
defineProps<{ asignacion: AsignacionInventario | null }>()
</script>

<template>
  <template v-if="asignacion">
    <p v-if="!asignacion.bodega" class="asignado is-sin-bodega">
      <i class="fa-solid fa-triangle-exclamation"></i>
      Aún no tienes una bodega asignada: pide a administración que te la asigne para poder vender.
    </p>
    <p v-else class="asignado">
      <i class="fa-solid fa-warehouse"></i>
      Ves y vendes solo el stock de la bodega <b>{{ asignacion.bodega }}</b>.
    </p>
    <p v-if="asignacion.restringido" class="asignado">
      <i class="fa-solid fa-filter"></i>
      Ves solo el inventario que administración te asignó
      (<b>{{ asignacion.productos.length }}</b> producto{{ asignacion.productos.length === 1 ? '' : 's' }}).
    </p>
  </template>
</template>

<style lang="scss" scoped>
.asignado {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--accent-soft);
  border: 1px solid rgba($primary, 0.2);
  font-family: $font-secondary;
  font-size: 0.78rem;
  color: var(--text-soft);
  i { color: $primary; }
  b { color: var(--text); }
  &.is-sin-bodega { background: rgba($alert-error, 0.08); border-color: rgba($alert-error, 0.3); color: $alert-error; i { color: $alert-error; } }
}
</style>
