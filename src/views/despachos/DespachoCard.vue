<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { formatDate, formatQty, formatPlazo } from '@/utils/format'
import type { Pedido } from '@/types/erp'

/** Tarjeta de un pedido para bodega: qué sale, en qué estado está y su salida. */
const props = defineProps<{ pedido: Pedido }>()
const emit = defineEmits<{ despachar: [] }>()

type Tono = 'success' | 'info' | 'danger' | 'warning'

const fotosOp = computed(() => {
  if (props.pedido.fotos?.length) return props.pedido.fotos
  return props.pedido.fotoUrl ? [props.pedido.fotoUrl] : []
})
const salida = computed(() => (props.pedido.despacho?.salidaAt ? new Date(props.pedido.despacho.salidaAt) : null))

const estado = computed((): { tone: Tono; label: string } => {
  if (salida.value) return { tone: 'success', label: 'Despachado' }
  if (props.pedido.estado === 'aprobado') return { tone: 'info', label: 'Aprobado · por despachar' }
  if (props.pedido.estado === 'rechazado') return { tone: 'danger', label: 'Rechazado' }
  return { tone: 'warning', label: 'Pendiente de revisión' }
})

const hora = (d: Date) => d.toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const miniatura = (u: string) => u.replace('/image/upload/', '/image/upload/c_fill,w_120,h_120/')
</script>

<template>
  <article class="dc" :class="{ 'is-listo': pedido.estado === 'aprobado' && !salida }">
    <header class="dc__head">
      <div class="dc__who">
        <strong>{{ pedido.clienteNombre }}</strong>
        <small><code>{{ pedido.numero }}</code> · {{ formatDate(pedido.createdAt) }} · {{ formatPlazo(pedido.plazoCreditoDias) }} · {{ pedido.vendedorNombre }}</small>
      </div>
      <BaseBadge :tone="estado.tone">{{ estado.label }}</BaseBadge>
    </header>

    <ul class="dc__items">
      <li v-for="(it, i) in pedido.items" :key="i">
        <span class="dc__qty">{{ formatQty(it.cantidad) }}</span>
        <span class="dc__uni">{{ it.unidad }}</span>
        <span class="dc__prod">{{ it.productoNombre }}<small v-if="it.bodega">{{ it.bodega }}</small></span>
      </li>
    </ul>

    <p v-if="pedido.observacion" class="dc__nota"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i> {{ pedido.observacion }}</p>

    <div v-if="fotosOp.length" class="dc__fotos">
      <span>Fotos de la OP</span>
      <a v-for="(u, k) in fotosOp" :key="u" :href="u" target="_blank" rel="noopener">
        <img :src="miniatura(u)" :alt="`Foto ${k + 1} de la orden de pedido`" loading="lazy" />
      </a>
    </div>

    <p v-if="pedido.estado === 'enviado'" class="dc__aviso is-warn">
      <i class="fa-solid fa-hand" aria-hidden="true"></i> Esperando aprobación de administración. No despachar todavía.
    </p>
    <p v-else-if="pedido.estado === 'rechazado'" class="dc__aviso is-error">
      <i class="fa-solid fa-ban" aria-hidden="true"></i> Rechazado<template v-if="pedido.motivoRechazo">: {{ pedido.motivoRechazo }}</template>. No se despacha.
    </p>

    <div v-if="salida" class="dc__salida">
      <p><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Salió de bodega el <b>{{ hora(salida) }}</b> · {{ pedido.despacho?.despachadoPor }}</p>
      <p v-if="pedido.despacho?.observacion" class="dc__nota">{{ pedido.despacho.observacion }}</p>
      <div v-if="pedido.despacho?.fotos.length" class="dc__fotos">
        <span>Fotos del despacho</span>
        <a v-for="(u, k) in pedido.despacho.fotos" :key="u" :href="u" target="_blank" rel="noopener">
          <img :src="miniatura(u)" :alt="`Foto ${k + 1} del despacho`" loading="lazy" />
        </a>
      </div>
      <button type="button" class="dc__btn is-sec" @click="emit('despachar')">
        <i class="fa-solid fa-camera" aria-hidden="true"></i> Agregar o cambiar fotos
      </button>
    </div>
    <button v-else-if="pedido.estado === 'aprobado'" type="button" class="dc__btn" @click="emit('despachar')">
      <i class="fa-solid fa-truck-ramp-box" aria-hidden="true"></i> Marcar salida
    </button>
  </article>
</template>

<style lang="scss" scoped>
.dc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);

  &.is-listo { border-color: rgba($primary, 0.45); }

  &__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  &__who {
    display: flex; flex-direction: column; gap: 2px; min-width: 0;
    strong { font-size: 0.95rem; font-weight: 800; }
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); }
    code { font-weight: 700; color: $primary; }
  }

  &__items { list-style: none; display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  &__items li {
    display: flex; align-items: baseline; gap: 8px; padding: 9px 12px; font-family: $font-secondary;
    & + li { border-top: 1px solid var(--border); }
  }
  &__qty { min-width: 42px; font-size: 1.05rem; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; text-align: right; }
  &__uni { min-width: 52px; font-size: 0.72rem; color: var(--text-soft); }
  &__prod {
    flex: 1; min-width: 0; font-size: 0.86rem; font-weight: 600;
    small { display: block; font-size: 0.68rem; font-weight: 500; color: var(--text-faint); }
  }

  &__nota { display: flex; gap: 6px; font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft); font-style: italic; }

  &__fotos {
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
    span { flex-basis: 100%; font-family: $font-secondary; font-size: 0.7rem; font-weight: 700; color: var(--text-faint); }
    img { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); background: rgba($primary-dark, 0.05); font-size: 0; color: transparent; }
  }

  &__aviso {
    display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border-radius: 9px; font-family: $font-secondary; font-size: 0.8rem; font-weight: 600;
    &.is-warn { background: $alert-warning-bg; color: darken($alert-warning, 25%); }
    &.is-error { background: $alert-error-bg; color: darken($alert-error, 8%); }
  }

  &__salida {
    display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: 10px; background: rgba($secondary, 0.08);
    > p:first-child { display: flex; align-items: center; gap: 8px; font-family: $font-secondary; font-size: 0.82rem; i { color: darken($secondary, 10%); } }
  }

  &__btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 0 16px;
    border: none; border-radius: 11px; background: $primary; color: $white;
    font-family: $font-principal; font-size: 0.92rem; font-weight: 800; cursor: pointer;
    &:hover { background: darken($primary, 6%); }
    &.is-sec { min-height: 44px; background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); font-size: 0.82rem; font-weight: 700;
      &:hover { border-color: $primary; color: $primary; } }
  }
}
</style>
