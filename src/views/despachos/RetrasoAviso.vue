<script setup lang="ts">
import { computed } from 'vue'
import { fechaCorta } from '@/composables/useAlertasPedidos'
import type { Pedido } from '@/types/erp'

/** Retraso vigente del despacho (y cuántas veces se ha movido). Solo si aún no sale. */
const props = defineProps<{ pedido: Pedido }>()

const retrasos = computed(() => (props.pedido.despacho?.salidaAt ? [] : props.pedido.retrasos || []))
const ultimo = computed(() => retrasos.value[retrasos.value.length - 1] || null)
const registrado = computed(() =>
  ultimo.value
    ? new Date(ultimo.value.registradoAt).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '',
)
</script>

<template>
  <div v-if="ultimo" class="retraso" role="status">
    <i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i>
    <div>
      <strong>No salió · nueva salida: {{ fechaCorta(ultimo.nuevaFecha) }}</strong>
      <p>Motivo: {{ ultimo.motivo }}</p>
      <small>
        Registrado el {{ registrado }} · {{ ultimo.registradoPor }}
        <template v-if="retrasos.length > 1"> · se ha retrasado {{ retrasos.length }} veces</template>
      </small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.retraso {
  display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 10px;
  background: $alert-warning-bg; border: 1px solid rgba($alert-warning, 0.45); color: darken($alert-warning, 28%);
  font-family: $font-secondary;
  > i { margin-top: 3px; }
  strong { display: block; font-size: 0.84rem; font-weight: 800; }
  p { font-size: 0.8rem; margin-top: 2px; }
  small { display: block; font-size: 0.7rem; opacity: 0.85; margin-top: 4px; }
}
</style>
