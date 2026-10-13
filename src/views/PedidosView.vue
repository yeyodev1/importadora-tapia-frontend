<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePedidosStore } from '@/stores/pedidos'
import { useUserStore } from '@/stores/user'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import PedidoFormModal from './pedidos/PedidoFormModal.vue'
import PedidoComprobante from './pedidos/PedidoComprobante.vue'
import PedidoFotosEditor from './pedidos/PedidoFotosEditor.vue'
import RetrasoAviso from './despachos/RetrasoAviso.vue'
import EntregasParciales from './despachos/EntregasParciales.vue'
import { esEntregaParcial } from './despachos/entregas'
import DecisionPedidoModal, { type Decision } from './pedidos/DecisionPedidoModal.vue'
import FiltroEstadoPedidos, { type FiltroEstado } from './pedidos/FiltroEstadoPedidos.vue'
import PedidoDecisiones from './pedidos/PedidoDecisiones.vue'
import AnularPedidoModal from './pedidos/AnularPedidoModal.vue'
import AjustarPedidoModal from './pedidos/AjustarPedidoModal.vue'
import { LABEL_ESTADO, TONO_ESTADO, esDecidible, esModificable } from './pedidos/estadoPedido'
import { formatMoney, formatDate, formatQty, formatPlazo } from '@/utils/format'
import { pedidosService } from '@/services/pedidos.service'
import type { Pedido } from '@/types/erp'

const pedidos = usePedidosStore()
const userStore = useUserStore()
const modalOpen = ref(false)
const expandido = ref<string | null>(null)
const comprobante = ref<Pedido | null>(null)
const decidiendo = ref<Pedido | null>(null)
const accion = ref<Decision>('aprobado')
const anulando = ref<Pedido | null>(null)
const ajustando = ref<Pedido | null>(null)

onMounted(() => pedidos.fetch())

// Filtro por estado. Admin arranca en "Sin aprobación" (su cola de trabajo); el vendedor en "Todos".
const FILTRO_KEY = `pedidos_filtro_${userStore.role || 'x'}`
function filtroGuardado(): FiltroEstado {
  try {
    const v = localStorage.getItem(FILTRO_KEY) as FiltroEstado | null
    if (v && ['todos', 'enviado', 'en_espera', 'aprobado', 'rechazado', 'anulado'].includes(v)) return v
  } catch {
    /* sin almacenamiento */
  }
  return userStore.isAdmin ? 'enviado' : 'todos'
}
const filtro = ref<FiltroEstado>(filtroGuardado())
watch(filtro, (v) => {
  try {
    localStorage.setItem(FILTRO_KEY, v)
  } catch {
    /* sin almacenamiento */
  }
})

// Buscador ("lupita"): filtra al instante lo cargado y, desde 2 letras, busca en
// todo el historial del servidor para traer también las OP antiguas del cliente.
const buscar = ref('')
const delServidor = ref<Pedido[] | null>(null)
const buscando = ref(false)
const normalizar = (s?: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
let timerBusqueda: number | undefined
let ultimaBusqueda = 0
watch(buscar, (v) => {
  window.clearTimeout(timerBusqueda)
  const q = v.trim()
  if (q.length < 2) {
    delServidor.value = null
    buscando.value = false
    return
  }
  buscando.value = true
  timerBusqueda = window.setTimeout(async () => {
    const id = ++ultimaBusqueda
    try {
      const r = await pedidosService.buscar(q)
      if (id === ultimaBusqueda) delServidor.value = r
    } catch {
      if (id === ultimaBusqueda) delServidor.value = null
    } finally {
      if (id === ultimaBusqueda) buscando.value = false
    }
  }, 350)
})
onBeforeUnmount(() => window.clearTimeout(timerBusqueda))

const coincide = (p: Pedido, q: string) =>
  [p.clienteNombre, p.numero, p.clienteCodigo, p.vendedorNombre].some((t) => normalizar(t).includes(q))

/** Pedidos que pasan el buscador (lo del servidor se cambia por la versión del store si ya está cargada). */
/**
 * Un vendedor que también despacha recibe además los pedidos de su bodega
 * (para Despachos); aquí solo ve los suyos.
 */
const misPedidos = computed(() =>
  userStore.isVendedor && userStore.isBodega ? pedidos.data.filter((p) => p.vendedorId === userStore.id) : pedidos.data,
)

const encontrados = computed(() => {
  const q = normalizar(buscar.value.trim())
  if (!q) return misPedidos.value
  const locales = misPedidos.value.filter((p) => coincide(p, q))
  const ids = new Set(locales.map((p) => p._id))
  const soloMios = userStore.isVendedor && userStore.isBodega
  const extra = (delServidor.value || []).filter((p) => !ids.has(p._id) && (!soloMios || p.vendedorId === userStore.id))
  return [...locales, ...extra]
})

// Bodega (Quito / Guayaquil): los clientes de cada ciudad se atienden desde su bodega.
const BODEGA_KEY = `pedidos_bodega_${userStore.role || 'x'}`
const bodega = ref('')
try {
  bodega.value = localStorage.getItem(BODEGA_KEY) || ''
} catch {
  /* sin almacenamiento */
}
watch(bodega, (v) => {
  try {
    localStorage.setItem(BODEGA_KEY, v)
  } catch {
    /* sin almacenamiento */
  }
})
const bodegas = computed(() => [...new Set(misPedidos.value.flatMap((p) => p.items.map((i) => i.bodega || '')).filter(Boolean))].sort())
// Si la bodega guardada ya no aparece en los pedidos, se vuelve a "Todas".
const bodegaActiva = computed(() => (bodegas.value.includes(bodega.value) ? bodega.value : ''))
const enBodega = computed(() =>
  bodegaActiva.value ? encontrados.value.filter((p) => p.items.some((i) => i.bodega === bodegaActiva.value)) : encontrados.value,
)

const hayFiltros = computed(() => !!buscar.value.trim() || !!bodegaActiva.value)
function limpiarFiltros() {
  buscar.value = ''
  bodega.value = ''
}

const conteo = computed(() => {
  const c: Record<FiltroEstado, number> = { todos: enBodega.value.length, enviado: 0, en_espera: 0, aprobado: 0, rechazado: 0, anulado: 0 }
  for (const p of enBodega.value) c[p.estado] = (c[p.estado] || 0) + 1
  return c
})

/** Lo que pide acción va arriba (sin aprobación, luego en espera); dentro, el más reciente primero. */
const PRIORIDAD: Record<string, number> = { enviado: 0, en_espera: 1 }
const lista = computed(() =>
  enBodega.value
    .filter((p) => filtro.value === 'todos' || p.estado === filtro.value)
    .sort((a, b) => (PRIORIDAD[a.estado] ?? 2) - (PRIORIDAD[b.estado] ?? 2) || b.createdAt.localeCompare(a.createdAt)),
)

const total = computed(() => lista.value.reduce((s, p) => s + Number(p.total || 0), 0))

function decidir(p: Pedido, d: Decision) {
  accion.value = d
  decidiendo.value = p
}
</script>

<template>
  <div>
    <PageHeader
      title="Pedidos"
      subtitle="Órdenes de pedido. El vendedor arma la orden; administración la aprueba."
      source="local"
      :count="pedidos.fetchedAt ? pedidos.data.length : null"
      :refreshing="pedidos.loading && !!pedidos.fetchedAt"
      @refresh="pedidos.fetch(true)"
    >
      <template #actions>
        <span class="total">Total {{ formatMoney(total) }}</span>
        <button class="new" type="button" @click="modalOpen = true">+ Nuevo pedido</button>
      </template>
    </PageHeader>

    <SkeletonTable v-if="pedidos.loading && !pedidos.fetchedAt" :cols="4" :rows="6" />

    <EmptyState
      v-else-if="pedidos.error"
      tone="error"
      title="No se pudo cargar"
      :message="pedidos.error"
      @retry="pedidos.fetch(true)"
    />

    <EmptyState
      v-else-if="!pedidos.data.length"
      title="Sin pedidos"
      message="Crea el primer pedido con el botón de arriba: elige productos del inventario, cantidades y precio."
    />

    <template v-else>
      <label class="buscar">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input
          id="pedidos-buscar"
          v-model="buscar"
          type="search"
          :placeholder="userStore.isAdmin ? 'Buscar por cliente, asesor o número de OP…' : 'Buscar por cliente o número de OP…'"
          aria-label="Buscar pedidos"
        />
        <i v-if="buscando" class="fa-solid fa-spinner fa-spin buscar__spin" aria-hidden="true"></i>
      </label>

      <div v-if="bodegas.length > 1 || hayFiltros" class="bodegas" role="group" aria-label="Filtrar por bodega">
        <template v-if="bodegas.length > 1">
          <i class="fa-solid fa-warehouse bodegas__ico" aria-hidden="true"></i>
          <button type="button" class="chip" :class="{ 'is-on': !bodegaActiva }" :aria-pressed="!bodegaActiva" @click="bodega = ''">Todas las bodegas</button>
          <button
            v-for="b in bodegas"
            :key="b"
            type="button"
            class="chip"
            :class="{ 'is-on': bodegaActiva === b }"
            :aria-pressed="bodegaActiva === b"
            @click="bodega = b"
          >{{ b }}</button>
        </template>
        <button v-if="hayFiltros" type="button" class="limpiar" @click="limpiarFiltros">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i> Quitar filtros
        </button>
      </div>

      <FiltroEstadoPedidos v-model="filtro" :conteo="conteo" />

      <EmptyState
        v-if="!lista.length && buscar.trim() && buscando"
        title="Buscando…"
        message="Revisando todo el historial de pedidos."
      />
      <EmptyState
        v-else-if="!lista.length && hayFiltros && !conteo.todos"
        title="Nada con esta búsqueda"
        message="Revisa cómo está escrito el cliente o el número de OP, o toca “Quitar filtros”."
      />
      <EmptyState
        v-else-if="!lista.length"
        title="Nada en este estado"
        message="Toca otro filtro de arriba para ver el resto de pedidos."
      />

      <ul v-else class="lista">
        <li v-for="(p, i) in lista" :key="p._id" class="ped stagger-item" :style="{ '--i': i }">
          <div class="ped__head" @click="expandido = expandido === p._id ? null : p._id">
            <div class="ped__info">
              <strong>{{ p.clienteNombre }} <code class="ped__num">{{ p.numero }}</code></strong>
              <small>
                {{ p.items.length }} producto{{ p.items.length > 1 ? 's' : '' }} · {{ formatDate(p.createdAt) }} · {{ formatPlazo(p.plazoCreditoDias) }}
                <template v-if="userStore.isAdmin"> · {{ p.vendedorNombre }}</template>
              </small>
              <em v-if="p.estado === 'en_espera' && p.motivoEspera" class="ped__espera">
                <i class="fa-solid fa-circle-pause" aria-hidden="true"></i> {{ p.motivoEspera }}
              </em>
            </div>
            <div class="ped__right">
              <b>{{ formatMoney(p.total) }}</b>
              <BaseBadge v-if="p.despacho?.salidaAt" tone="success">Despachado</BaseBadge>
              <BaseBadge v-else-if="p.estado === 'aprobado' && esEntregaParcial(p)" tone="warning">Entrega parcial</BaseBadge>
              <BaseBadge v-else-if="p.estado === 'aprobado' && p.retrasos?.length" tone="warning">Retrasado</BaseBadge>
              <BaseBadge v-else :tone="TONO_ESTADO[p.estado] || 'info'">{{ LABEL_ESTADO[p.estado] || p.estado }}</BaseBadge>
              <i class="fa-solid fa-chevron-down ped__caret" :class="{ 'is-open': expandido === p._id }"></i>
            </div>
          </div>

          <div v-if="expandido === p._id" class="ped__detail">
            <div v-for="(it, j) in p.items" :key="j" class="item">
              <span class="item__name">{{ it.productoNombre }}</span>
              <span class="item__qty">{{ formatQty(it.cantidad) }} {{ it.unidad }} × {{ formatMoney(it.precioUnitario) }}</span>
              <span class="item__sub">{{ formatMoney(it.subtotal) }}</span>
            </div>
            <p v-if="p.observacion" class="ped__obs">{{ p.observacion }}</p>
            <PedidoDecisiones :pedido="p" />

            <button type="button" class="ped__comp" @click="comprobante = p">
              <i class="fa-solid fa-file-invoice"></i> Ver comprobante
            </button>
            <p v-if="p.despacho?.salidaAt" class="ped__desp">
              <i class="fa-solid fa-truck-fast" aria-hidden="true"></i>
              Salió de bodega el {{ new Date(p.despacho.salidaAt).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
              · {{ p.despacho.despachadoPor }}
              <template v-if="p.despacho.fotos.length"> · {{ p.despacho.fotos.length }} foto{{ p.despacho.fotos.length === 1 ? '' : 's' }}</template>
            </p>
            <EntregasParciales :pedido="p" class="ped__ent" />
            <RetrasoAviso :pedido="p" />
            <PedidoFotosEditor :pedido="p" />

            <div v-if="userStore.isAdmin && esDecidible(p)" class="ped__acc">
              <button type="button" class="ok" @click="decidir(p, 'aprobado')">Aprobar</button>
              <button type="button" class="wait" @click="decidir(p, 'en_espera')">{{ p.estado === 'en_espera' ? 'Editar espera' : 'En espera' }}</button>
              <button type="button" class="no" @click="decidir(p, 'rechazado')">No aprobar</button>
            </div>
            <!-- Pedido vivo que aún no sale: admin baja cantidades; admin o su asesor lo anulan. -->
            <div v-if="esModificable(p)" class="ped__mod">
              <button v-if="userStore.isAdmin" type="button" @click="ajustando = p">
                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Editar cantidades
              </button>
              <!-- Si ya salió una parte no se anula: se ajustan las cantidades a lo entregado. -->
              <button v-if="!p.entregas?.length" type="button" class="no" @click="anulando = p">
                <i class="fa-solid fa-ban" aria-hidden="true"></i> Anular pedido
              </button>
            </div>
          </div>
        </li>
      </ul>
    </template>

    <PedidoFormModal :open="modalOpen" @close="modalOpen = false" />
    <PedidoComprobante :open="!!comprobante" :pedido="comprobante" @close="comprobante = null" />
    <DecisionPedidoModal :pedido="decidiendo" :accion="accion" @close="decidiendo = null" />
    <AnularPedidoModal :pedido="anulando" @close="anulando = null" />
    <AjustarPedidoModal :pedido="ajustando" @close="ajustando = null" />
  </div>
</template>

<style lang="scss" scoped>
.total { font-family: $font-secondary; font-size: 0.78rem; font-weight: 600;
  padding: 8px 14px; border-radius: 8px; background: var(--accent-soft); color: $primary; }
.new { padding: 9px 16px; border: none; border-radius: 8px; background: $primary; color: $white;
  font-family: $font-principal; font-size: 0.8rem; font-weight: 700; cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  &:hover { background: darken($primary, 6%); transform: translateY(-1px); } }
.buscar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 0 14px; min-height: 44px;
  border: 1.5px solid var(--border-strong); border-radius: 10px; background: var(--surface);
  &:focus-within { border-color: $primary; }
  i { color: var(--text-faint); font-size: 0.85rem; }
  input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: var(--text);
    font-family: $font-secondary; font-size: 0.85rem; padding: 10px 0; }
  &__spin { color: $primary !important; } }
.bodegas { display: flex; align-items: center; gap: 8px; overflow-x: auto; padding-bottom: 2px; margin-bottom: 10px;
  &__ico { flex-shrink: 0; color: var(--text-faint); font-size: 0.85rem; } }
.chip { flex-shrink: 0; min-height: 38px; padding: 7px 14px; border: 1.5px solid var(--border-strong); border-radius: 999px;
  background: var(--surface); cursor: pointer; white-space: nowrap; font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; color: var(--text);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: $primary; color: $white; } }
.limpiar { flex-shrink: 0; background: none; border: none; padding: 6px 4px; cursor: pointer; white-space: nowrap;
  font-family: $font-secondary; font-size: 0.76rem; font-weight: 700; color: $alert-error;
  &:hover { text-decoration: underline; } }
.lista { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.ped { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow-card); overflow: hidden;
  &__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 16px; cursor: pointer;
    &:hover { background: rgba($primary, 0.02); } }
  &__info { min-width: 0;
    strong { display: block; font-size: 0.88rem; font-weight: 700; }
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); } }
  &__right { display: flex; align-items: center; gap: 12px;
    b { font-size: 0.95rem; font-weight: 800; font-variant-numeric: tabular-nums; } }
  &__caret { font-size: 0.7rem; color: var(--text-faint); transition: transform 0.2s var(--ease-out);
    &.is-open { transform: rotate(180deg); } }
  &__detail { padding: 4px 16px 16px; border-top: 1px solid var(--border); }
  &__num { font-family: $font-secondary; font-size: 0.66rem; font-weight: 700; color: $primary;
    background: var(--accent-soft); border-radius: 5px; padding: 1px 6px; margin-left: 6px; }
  &__comp { margin-top: 12px; padding: 8px 14px; border: 1px solid var(--border-strong); border-radius: 8px;
    background: var(--surface); font-family: $font-principal; font-size: 0.76rem; font-weight: 700; color: var(--text); cursor: pointer;
    display: inline-flex; align-items: center; gap: 7px;
    &:hover { border-color: $primary; color: $primary; } }
  &__comp.is-foto { text-decoration: none; margin-left: 8px; }
  &__desp { display: block; overflow-wrap: anywhere; margin-top: 12px; i { margin-right: 6px; } padding: 9px 12px; border-radius: 9px;
    background: rgba($secondary, 0.1); font-family: $font-secondary; font-size: 0.78rem; color: darken($secondary, 18%); }
  &__ent { margin-top: 12px; }
  &__obs { font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); margin-top: 8px; font-style: italic; }
  &__espera { display: block; margin-top: 4px; font-family: $font-secondary; font-size: 0.72rem; font-style: normal; font-weight: 600;
    color: darken($alert-warning, 25%); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__acc { display: flex; gap: 8px; margin-top: 12px;
    button { flex: 1; min-width: 0; min-height: 42px; padding: 9px 6px; border-radius: 8px; font-family: $font-principal; font-size: 0.78rem; font-weight: 700; cursor: pointer; border: 1px solid var(--border-strong); background: var(--surface); }
    .ok:hover { border-color: $secondary; color: darken($secondary, 10%); background: rgba($secondary, 0.08); }
    .wait:hover { border-color: $alert-warning; color: darken($alert-warning, 25%); background: $alert-warning-bg; }
    .no:hover { border-color: $alert-error; color: $alert-error; background: $alert-error-bg; } }
  &__mod { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
    button { flex: 1 1 160px; min-height: 40px; padding: 8px 10px; border-radius: 8px; border: 1px dashed var(--border-strong);
      background: transparent; font-family: $font-principal; font-size: 0.76rem; font-weight: 700; color: var(--text-soft); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      &:hover { border-color: $primary; color: $primary; } }
    .no:hover { border-color: $alert-error; color: $alert-error; background: $alert-error-bg; } }
}
.item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border);
  font-family: $font-secondary; font-size: 0.8rem;
  &:last-of-type { border-bottom: none; }
  &__name { flex: 1; min-width: 0; font-weight: 600; }
  &__qty { color: var(--text-faint); font-size: 0.72rem; }
  &__sub { font-weight: 700; font-variant-numeric: tabular-nums; min-width: 70px; text-align: right; } }
</style>
