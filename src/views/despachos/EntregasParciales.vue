<script setup lang="ts">
import { computed } from 'vue'
import { avanceEntregas } from './entregas'
import { formatQty } from '@/utils/format'
import type { Pedido } from '@/types/erp'

/** Historial de salidas cuando el cliente recibe por partes: cuándo, qué salió y cuánto falta. */
const props = defineProps<{ pedido: Pedido }>()

const avance = computed(() => avanceEntregas(props.pedido))
const nombre = (codigo: string) => props.pedido.items.find((i) => i.productoCodigo === codigo)?.productoNombre || codigo
const hora = (iso: string) =>
  new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const faltan = computed(() => avance.value.filter((a) => a.falta > 0))
const miniatura = (u: string) => u.replace('/image/upload/', '/image/upload/c_fill,w_120,h_120/')
</script>

<template>
  <!-- Solo cuando hubo más de una salida o quedó algo pendiente: el despacho de una sola vez ya se ve abajo. -->
  <details v-if="(pedido.entregas?.length || 0) > 1 || (pedido.entregas?.length && faltan.length)" class="ent" open>
    <summary>
      <i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i>
      Entregas por partes ({{ pedido.entregas!.length }})
      <span v-if="faltan.length" class="ent__falta">
        · faltan <template v-for="(a, j) in faltan" :key="j">{{ j ? ', ' : ' ' }}{{ formatQty(a.falta) }} {{ a.it.productoNombre }}</template>
      </span>
    </summary>
    <ol>
      <li v-for="(e, i) in pedido.entregas" :key="i">
        <b>{{ i + 1 }}.ª salida · {{ hora(e.at) }}</b>
        <span><template v-for="(c, j) in e.cantidades" :key="j">{{ j ? ', ' : '' }}{{ formatQty(c.cantidad) }} {{ nombre(c.productoCodigo) }}</template></span>
        <small>{{ e.por }}<template v-if="e.observacion"> · {{ e.observacion }}</template></small>
        <span v-if="e.fotos.length" class="ent__fotos">
          <a v-for="(u, k) in e.fotos" :key="u" :href="u" target="_blank" rel="noopener">
            <img :src="miniatura(u)" :alt="`Foto ${k + 1} de la salida ${i + 1}`" loading="lazy" />
          </a>
        </span>
      </li>
    </ol>
  </details>
</template>

<style lang="scss" scoped>
.ent {
  padding: 10px 12px; border-radius: 10px; background: $alert-warning-bg; border: 1px solid rgba($alert-warning, 0.45);
  font-family: $font-secondary; font-size: 0.78rem; color: darken($alert-warning, 30%);
  summary { cursor: pointer; font-weight: 800; min-height: 28px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  &__falta { font-weight: 600; }
  ol { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-top: 8px; padding-left: 10px; border-left: 2px solid rgba($alert-warning, 0.5); }
  li { display: flex; flex-direction: column; gap: 2px; color: var(--text);
    b { font-weight: 800; }
    small { font-size: 0.68rem; color: var(--text-faint); overflow-wrap: anywhere; } }
  &__fotos { display: flex; gap: 6px; margin-top: 4px;
    img { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; } }
}
</style>
