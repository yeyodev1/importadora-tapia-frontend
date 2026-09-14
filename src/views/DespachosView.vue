<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import DespachoCard from './despachos/DespachoCard.vue'
import MarcarSalidaModal from './despachos/MarcarSalidaModal.vue'
import { usePedidosStore } from '@/stores/pedidos'
import type { Pedido } from '@/types/erp'

/** Bodega: pedidos por despachar, en revisión, rechazados y despachados. Se actualiza solo. */
const pedidos = usePedidosStore()

type Grupo = 'por_despachar' | 'revision' | 'rechazados' | 'despachados'
const grupo = ref<Grupo>('por_despachar')
const buscar = ref('')
const seleccionado = ref<Pedido | null>(null)

const GRUPOS: { v: Grupo; label: string; ayuda: string; icono: string; tono: string }[] = [
  { v: 'por_despachar', label: 'Por despachar', ayuda: 'Aprobados, listos para salir', icono: 'fa-truck-ramp-box', tono: 'is-primario' },
  { v: 'revision', label: 'Pendientes de revisión', ayuda: 'Aún no los aprueba administración', icono: 'fa-hourglass-half', tono: 'is-aviso' },
  { v: 'rechazados', label: 'Rechazados', ayuda: 'No se despachan', icono: 'fa-ban', tono: 'is-peligro' },
  { v: 'despachados', label: 'Despachados', ayuda: 'Ya salieron de bodega', icono: 'fa-circle-check', tono: 'is-ok' },
]

const VACIO: Record<Grupo, { titulo: string; mensaje: string }> = {
  por_despachar: { titulo: 'No hay pedidos por despachar', mensaje: 'Cuando administración apruebe un pedido aparecerá aquí.' },
  revision: { titulo: 'Nada pendiente de revisión', mensaje: 'Todos los pedidos enviados ya fueron revisados.' },
  rechazados: { titulo: 'Sin pedidos rechazados', mensaje: 'Los pedidos rechazados por administración aparecen aquí.' },
  despachados: { titulo: 'Aún no hay despachos', mensaje: 'Al marcar la salida de un pedido aparecerá aquí.' },
}

function grupoDe(p: Pedido): Grupo {
  if (p.despacho?.salidaAt) return 'despachados'
  if (p.estado === 'aprobado') return 'por_despachar'
  if (p.estado === 'rechazado') return 'rechazados'
  return 'revision'
}

const conteo = computed(() => {
  const c: Record<Grupo, number> = { por_despachar: 0, revision: 0, rechazados: 0, despachados: 0 }
  for (const p of pedidos.data) c[grupoDe(p)]++
  return c
})

const lista = computed(() => {
  const q = buscar.value.trim().toLowerCase()
  return pedidos.data
    .filter((p) => grupoDe(p) === grupo.value)
    .filter((p) => !q || p.clienteNombre.toLowerCase().includes(q) || p.numero.toLowerCase().includes(q))
    .sort((a, b) =>
      grupo.value === 'despachados'
        ? (b.despacho?.salidaAt || '').localeCompare(a.despacho?.salidaAt || '')
        : a.createdAt.localeCompare(b.createdAt),
    )
})

// "En todo momento": se refresca cada minuto y al volver a la app.
let timer: number | undefined
function refrescar() {
  if (document.visibilityState === 'visible') pedidos.fetch(true)
}
onMounted(() => {
  pedidos.fetch(true)
  timer = window.setInterval(refrescar, 60000)
  document.addEventListener('visibilitychange', refrescar)
})
onBeforeUnmount(() => {
  window.clearInterval(timer)
  document.removeEventListener('visibilitychange', refrescar)
})
</script>

<template>
  <div>
    <PageHeader
      title="Despachos"
      subtitle="Pedidos para bodega. La lista se actualiza sola cada minuto."
      source="local"
      :updated-at="pedidos.fetchedAt"
      :refreshing="pedidos.loading && !!pedidos.fetchedAt"
      @refresh="pedidos.fetch(true)"
    />

    <div class="grupos" role="tablist" aria-label="Estado de los pedidos">
      <button
        v-for="g in GRUPOS"
        :key="g.v"
        type="button"
        role="tab"
        class="grupo"
        :class="[g.tono, { 'is-active': grupo === g.v }]"
        :aria-selected="grupo === g.v"
        @click="grupo = g.v"
      >
        <i class="fa-solid grupo__icono" :class="g.icono" aria-hidden="true"></i>
        <span class="grupo__n">{{ conteo[g.v] }}</span>
        <span class="grupo__txt">
          <strong>{{ g.label }}</strong>
          <small>{{ g.ayuda }}</small>
        </span>
      </button>
    </div>

    <label class="buscar">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input id="despachos-buscar" v-model="buscar" type="search" placeholder="Buscar por cliente o número de pedido…" />
    </label>

    <SkeletonTable v-if="pedidos.loading && !pedidos.fetchedAt" :cols="3" :rows="4" />
    <EmptyState v-else-if="pedidos.error" tone="error" title="No se pudo cargar" :message="pedidos.error" @retry="pedidos.fetch(true)" />
    <EmptyState v-else-if="!lista.length" :title="VACIO[grupo].titulo" :message="VACIO[grupo].mensaje" />
    <ul v-else class="lista">
      <li v-for="p in lista" :key="p._id">
        <DespachoCard :pedido="p" @despachar="seleccionado = p" />
      </li>
    </ul>

    <MarcarSalidaModal :pedido="seleccionado" @close="seleccionado = null" />
  </div>
</template>

<style lang="scss" scoped>
.grupos { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }

.grupo {
  flex: 1 1 160px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 72px;
  padding: 12px 14px;
  border: 1.5px solid var(--border-strong);
  border-radius: 12px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &__icono { font-size: 1.15rem; color: var(--text-faint); }
  &__n { font-family: $font-principal; font-size: 1.6rem; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
  &__txt {
    display: flex; flex-direction: column; min-width: 0;
    strong { font-size: 0.84rem; font-weight: 800; color: var(--text); }
    small { font-family: $font-secondary; font-size: 0.68rem; color: var(--text-soft); }
  }

  &.is-primario .grupo__icono { color: $primary; }
  &.is-aviso .grupo__icono { color: darken($alert-warning, 10%); }
  &.is-peligro .grupo__icono { color: $alert-error; }
  &.is-ok .grupo__icono { color: darken($secondary, 8%); }

  &:hover { border-color: $primary; }
  &.is-active { border-color: $primary; background: var(--accent-soft); }
  &.is-active.is-aviso { border-color: $alert-warning; background: $alert-warning-bg; }
  &.is-active.is-peligro { border-color: $alert-error; background: $alert-error-bg; }
  &.is-active.is-ok { border-color: $secondary; background: rgba($secondary, 0.1); }
}

.buscar {
  display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding: 0 12px;
  border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--text-faint);
  input { flex: 1; min-width: 0; padding: 11px 0; border: none; background: transparent; font-family: $font-secondary; font-size: 0.88rem; color: var(--text);
    &:focus { outline: none; } }
  &:focus-within { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}

.lista { list-style: none; display: flex; flex-direction: column; gap: 12px; }
</style>
