<script setup lang="ts">
import { computed } from 'vue'
import { LABEL_ESTADO, horaCorta } from './estadoPedido'
import type { Pedido } from '@/types/erp'

/** Lo que decidió administración: mensaje de espera, comentario de aprobación, rechazo y el historial corto. */
const props = defineProps<{ pedido: Pedido }>()

/** Últimas decisiones, la más reciente primero. */
const historial = computed(() => [...(props.pedido.historialEstado || [])].reverse().slice(0, 5))
const esperaDesde = computed(() => {
  const h = props.pedido.historialEstado || []
  for (let i = h.length - 1; i >= 0; i--) if (h[i]!.estado === 'en_espera') return h[i]!
  return null
})
</script>

<template>
  <div class="decs">
    <div v-if="pedido.estado === 'en_espera'" class="espera" role="status">
      <i class="fa-solid fa-circle-pause" aria-hidden="true"></i>
      <div>
        <strong>Pedido en espera</strong>
        <p>{{ pedido.motivoEspera || 'Administración dejó el pedido en espera.' }}</p>
        <small v-if="esperaDesde">{{ esperaDesde.por }} · {{ horaCorta(esperaDesde.at) }}</small>
      </div>
    </div>

    <p v-if="pedido.estado === 'aprobado' && pedido.comentarioAprobacion" class="nota is-ok">
      <i class="fa-solid fa-circle-check" aria-hidden="true"></i> {{ pedido.comentarioAprobacion }}
    </p>
    <p v-if="pedido.estado === 'rechazado' && pedido.motivoRechazo" class="nota is-error">
      <i class="fa-solid fa-ban" aria-hidden="true"></i> No aprobado: {{ pedido.motivoRechazo }}
    </p>
    <p v-if="pedido.estado === 'anulado' && pedido.anulacion" class="nota is-error">
      <i class="fa-solid fa-ban" aria-hidden="true"></i> Anulado: {{ pedido.anulacion.motivo }}
      <small>{{ pedido.anulacion.por }} · {{ horaCorta(pedido.anulacion.at) }}</small>
    </p>
    <div v-for="(a, i) in pedido.ajustes || []" :key="`aj${i}`" class="nota is-aviso">
      <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Cantidades ajustadas:
      <span v-for="(c, j) in a.cambios" :key="j">{{ j ? ', ' : ' ' }}{{ c.productoNombre }} {{ c.antes }} → {{ c.despues || 'quitado' }}</span>
      <template v-if="a.nota"> · {{ a.nota }}</template>
      <small>{{ a.por }} · {{ horaCorta(a.at) }}</small>
    </div>

    <details v-if="historial.length" class="hist">
      <summary>Historial de decisiones ({{ pedido.historialEstado!.length }})</summary>
      <ol>
        <li v-for="(h, i) in historial" :key="i" :class="`is-${h.estado}`">
          <b>{{ LABEL_ESTADO[h.estado] || h.estado }}</b>
          <span v-if="h.nota">{{ h.nota }}</span>
          <small>{{ h.por }} · {{ horaCorta(h.at) }}</small>
        </li>
      </ol>
    </details>
  </div>
</template>

<style lang="scss" scoped>
.decs { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; font-family: $font-secondary; }
.espera {
  display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 10px;
  background: $alert-warning-bg; border: 1px solid rgba($alert-warning, 0.45); color: darken($alert-warning, 28%);
  > i { margin-top: 3px; }
  strong { display: block; font-size: 0.84rem; font-weight: 800; }
  p { font-size: 0.84rem; margin-top: 2px; overflow-wrap: anywhere; }
  small { display: block; font-size: 0.7rem; opacity: 0.85; margin-top: 4px; }
}
.nota {
  padding: 8px 12px; border-radius: 9px; font-size: 0.78rem; overflow-wrap: anywhere;
  i { margin-right: 6px; }
  &.is-ok { background: rgba($secondary, 0.1); color: darken($secondary, 18%); }
  &.is-error { background: $alert-error-bg; color: darken($alert-error, 6%); }
  &.is-aviso { background: $alert-warning-bg; color: darken($alert-warning, 28%); }
  small { display: block; font-size: 0.68rem; opacity: 0.85; margin-top: 3px; }
}
.hist {
  font-size: 0.74rem; color: var(--text-soft);
  summary { cursor: pointer; font-weight: 700; padding: 4px 0; min-height: 32px; display: flex; align-items: center; }
  ol { list-style: none; display: flex; flex-direction: column; gap: 6px; padding-left: 10px; border-left: 2px solid var(--border); }
  li { display: flex; flex-direction: column; gap: 1px;
    b { font-weight: 800; color: var(--text); }
    span { overflow-wrap: anywhere; }
    small { font-size: 0.68rem; color: var(--text-faint); }
    &.is-en_espera b { color: darken($alert-warning, 25%); }
    &.is-aprobado b { color: darken($secondary, 14%); }
    &.is-rechazado b, &.is-anulado b { color: darken($alert-error, 6%); } }
}
</style>
