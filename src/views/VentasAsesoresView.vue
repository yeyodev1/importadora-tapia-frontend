<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import { erpService } from '@/services/erp.service'
import { pedidosService } from '@/services/pedidos.service'
import { useUserStore } from '@/stores/user'
import { formatMoney, formatQty } from '@/utils/format'
import type { CupoProducto, VentasAsesor } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Cuánto lleva cada asesor de su cupo (y cuánto le falta) y cuánto ha vendido
 * de cada producto. Cuenta los pedidos vivos: sin aprobación, en espera y
 * aprobados; los no aprobados y anulados no. Admin ve a todos; el asesor lo suyo.
 */
const userStore = useUserStore()

// ---- Cupos ----
const cupos = ref<CupoProducto[]>([])
const cargandoCupos = ref(false)
const errorCupos = ref('')
async function cargarCupos() {
  cargandoCupos.value = true
  errorCupos.value = ''
  try {
    cupos.value = (await erpService.getCupos()).filter((c) => c.cupos.length)
  } catch (err) {
    errorCupos.value = (err as ApiError)?.message || 'No se pudieron cargar los cupos'
  } finally {
    cargandoCupos.value = false
  }
}
const fechaCorta = (iso: string) => new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const pct = (usado: number, cantidad: number) => (cantidad > 0 ? Math.min(100, Math.round((usado / cantidad) * 100)) : usado > 0 ? 100 : 0)

// ---- Ventas por producto ----
type Rango = 'hoy' | 'semana' | 'mes' | 'mes_pasado' | 'todo' | 'fechas'
const RANGOS: { v: Rango; label: string }[] = [
  { v: 'hoy', label: 'Hoy' },
  { v: 'semana', label: 'Últimos 7 días' },
  { v: 'mes', label: 'Este mes' },
  { v: 'mes_pasado', label: 'Mes pasado' },
  { v: 'todo', label: 'Todo' },
  { v: 'fechas', label: 'Elegir fechas' },
]
const rango = ref<Rango>('mes')
/** Hoy en Ecuador, AAAA-MM-DD. */
const hoyEc = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date())
const desdeManual = ref(hoyEc().slice(0, 8) + '01')
const hastaManual = ref(hoyEc())

function sumarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const periodo = computed<{ desde?: string; hasta?: string }>(() => {
  const hoy = hoyEc()
  if (rango.value === 'hoy') return { desde: hoy, hasta: hoy }
  if (rango.value === 'semana') return { desde: sumarDias(hoy, -6), hasta: hoy }
  if (rango.value === 'mes') return { desde: hoy.slice(0, 8) + '01', hasta: hoy }
  if (rango.value === 'mes_pasado') {
    const finPasado = sumarDias(hoy.slice(0, 8) + '01', -1)
    return { desde: finPasado.slice(0, 8) + '01', hasta: finPasado }
  }
  if (rango.value === 'fechas') return { desde: desdeManual.value || undefined, hasta: hastaManual.value || undefined }
  return {}
})

const ventas = ref<VentasAsesor[]>([])
const cargandoVentas = ref(false)
const errorVentas = ref('')
const fetchedAt = ref<number | null>(null)
let pedidoId = 0
async function cargarVentas() {
  const id = ++pedidoId
  cargandoVentas.value = true
  errorVentas.value = ''
  try {
    const r = await pedidosService.ventasAsesores(periodo.value.desde, periodo.value.hasta)
    if (id !== pedidoId) return
    ventas.value = r
    fetchedAt.value = Date.now()
  } catch (err) {
    if (id === pedidoId) errorVentas.value = (err as ApiError)?.message || 'No se pudieron cargar las ventas'
  } finally {
    if (id === pedidoId) cargandoVentas.value = false
  }
}
watch(periodo, cargarVentas, { deep: true })

// Filtro por producto ("lenteja") y por asesor (solo admin).
const producto = ref('')
const asesor = ref('')
const normalizar = (s?: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const ventasFiltradas = computed(() => {
  const qp = normalizar(producto.value.trim())
  return ventas.value
    .filter((a) => !asesor.value || a.vendedorId === asesor.value)
    .map((a) => {
      const productos = qp ? a.productos.filter((p) => normalizar(p.productoNombre).includes(qp) || normalizar(p.productoCodigo).includes(qp)) : a.productos
      return { ...a, productos, total: Math.round(productos.reduce((s, p) => s + p.total, 0) * 100) / 100 }
    })
    .filter((a) => a.productos.length)
    .sort((a, b) => b.total - a.total)
})

/** Con un producto buscado: total de ese producto entre todos los asesores. */
const resumenProducto = computed(() => {
  if (!producto.value.trim()) return null
  const porUnidad = new Map<string, number>()
  let total = 0
  for (const a of ventasFiltradas.value) {
    for (const p of a.productos) {
      porUnidad.set(p.unidad || '', (porUnidad.get(p.unidad || '') || 0) + p.cantidad)
      total += p.total
    }
  }
  return { cantidades: [...porUnidad.entries()], total: Math.round(total * 100) / 100 }
})

const abiertos = ref<Set<string>>(new Set())
function alternar(id: string) {
  const s = new Set(abiertos.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  abiertos.value = s
}
const abierto = (id: string) => abiertos.value.has(id) || !!producto.value.trim() || !userStore.isAdmin || ventasFiltradas.value.length === 1

function refrescar() {
  cargarCupos()
  cargarVentas()
}
onMounted(refrescar)
</script>

<template>
  <div>
    <PageHeader
      title="Ventas por asesor"
      :subtitle="userStore.isAdmin ? 'Cuánto lleva cada asesor de su cupo y cuánto ha vendido de cada producto.' : 'Tu cupo y lo que has vendido de cada producto.'"
      source="local"
      :updated-at="fetchedAt"
      :refreshing="(cargandoVentas || cargandoCupos) && !!fetchedAt"
      @refresh="refrescar"
    />

    <!-- Cupos -->
    <section class="bloque">
      <h2 class="bloque__titulo"><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i> Cupos</h2>
      <SkeletonTable v-if="cargandoCupos && !cupos.length" :cols="4" :rows="3" />
      <EmptyState v-else-if="errorCupos" tone="error" title="No se pudieron cargar los cupos" :message="errorCupos" @retry="cargarCupos" />
      <p v-else-if="!cupos.length" class="vacio">
        {{ userStore.isAdmin ? 'No hay productos con cupo. Se fijan en Inventario, en la columna “Cupo”.' : 'No tienes productos con cupo: puedes vender sin límite.' }}
      </p>
      <div v-else class="cupos">
        <article v-for="c in cupos" :key="c.proCodigo" class="cupo">
          <header class="cupo__head">
            <strong>{{ c.proNombre || c.proCodigo }}</strong>
            <small>Contando desde el {{ fechaCorta(c.desde) }}</small>
          </header>
          <ul class="cupo__lista">
            <li v-for="x in [...c.cupos].sort((a, b) => a.queda - b.queda)" :key="x.venCodigo" class="cupo__fila">
              <div class="cupo__nombre">
                <span>{{ x.nombre || x.venCodigo }}</span>
                <small>
                  Lleva <b>{{ formatQty(x.usado) }}</b> de {{ formatQty(x.cantidad) }}
                  <template v-if="x.usado > x.cantidad"> · <b class="pasado">se pasó {{ formatQty(x.usado - x.cantidad) }}</b></template>
                </small>
              </div>
              <div class="cupo__barra" role="progressbar" :aria-valuenow="pct(x.usado, x.cantidad)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Cupo usado de ${x.nombre || x.venCodigo}`">
                <span :style="{ width: pct(x.usado, x.cantidad) + '%' }" :class="{ 'is-lleno': x.queda <= 0, 'is-casi': x.queda > 0 && pct(x.usado, x.cantidad) >= 80 }"></span>
              </div>
              <div class="cupo__falta" :class="{ 'is-cero': x.queda <= 0 }">
                <b>{{ formatQty(x.queda) }}</b>
                <small>{{ x.queda <= 0 ? 'sin cupo' : 'le falta' }}</small>
              </div>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- Ventas por producto -->
    <section class="bloque">
      <h2 class="bloque__titulo"><i class="fa-solid fa-chart-column" aria-hidden="true"></i> Vendido por producto</h2>

      <div class="fila" role="group" aria-label="Periodo">
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
      <div v-if="rango === 'fechas'" class="fechas">
        <label>Desde <input v-model="desdeManual" type="date" :max="hastaManual || hoyEc()" /></label>
        <label>Hasta <input v-model="hastaManual" type="date" :min="desdeManual" :max="hoyEc()" /></label>
      </div>

      <div class="filtros">
        <label class="buscar">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input v-model="producto" type="search" placeholder="Producto (ej. lenteja)…" aria-label="Filtrar por producto" />
        </label>
        <select v-if="userStore.isAdmin && ventas.length > 1" v-model="asesor" class="select" aria-label="Filtrar por asesor">
          <option value="">Todos los asesores</option>
          <option v-for="a in [...ventas].sort((x, y) => x.nombre.localeCompare(y.nombre))" :key="a.vendedorId" :value="a.vendedorId">{{ a.nombre }}</option>
        </select>
      </div>

      <p v-if="resumenProducto && ventasFiltradas.length" class="resumen">
        Total entre {{ ventasFiltradas.length === 1 ? 'el asesor' : `los ${ventasFiltradas.length} asesores` }}:
        <b v-for="[u, q] in resumenProducto.cantidades" :key="u">{{ formatQty(q) }} {{ u }}</b>
        · {{ formatMoney(resumenProducto.total) }}
      </p>

      <SkeletonTable v-if="cargandoVentas && !fetchedAt" :cols="4" :rows="5" />
      <EmptyState v-else-if="errorVentas" tone="error" title="No se pudieron cargar las ventas" :message="errorVentas" @retry="cargarVentas" />
      <EmptyState
        v-else-if="!ventasFiltradas.length"
        title="Sin ventas en este periodo"
        :message="producto.trim() ? 'Nadie vendió ese producto en estas fechas. Prueba otro periodo o revisa cómo está escrito.' : 'No hay pedidos sin aprobación, en espera ni aprobados en estas fechas.'"
      />
      <ul v-else class="asesores">
        <li v-for="a in ventasFiltradas" :key="a.vendedorId" class="asesor">
          <button type="button" class="asesor__head" :aria-expanded="abierto(a.vendedorId)" @click="alternar(a.vendedorId)">
            <span class="asesor__nombre">
              <strong>{{ a.nombre }}</strong>
              <small>{{ a.productos.length }} producto{{ a.productos.length === 1 ? '' : 's' }}</small>
            </span>
            <b class="asesor__total">{{ formatMoney(a.total) }}</b>
            <i v-if="userStore.isAdmin" class="fa-solid fa-chevron-down asesor__caret" :class="{ 'is-open': abierto(a.vendedorId) }" aria-hidden="true"></i>
          </button>
          <table v-if="abierto(a.vendedorId)" class="tabla">
            <thead>
              <tr><th>Producto</th><th class="num">Cantidad</th><th class="num">$</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in a.productos" :key="p.productoCodigo">
                <td>
                  {{ p.productoNombre }}
                  <small>{{ p.pedidos }} pedido{{ p.pedidos === 1 ? '' : 's' }}<template v-if="p.pendiente > 0"> · {{ formatQty(p.pendiente) }} sin aprobar aún</template></small>
                </td>
                <td class="num"><b>{{ formatQty(p.cantidad) }}</b> {{ p.unidad }}</td>
                <td class="num">{{ formatMoney(p.total) }}</td>
              </tr>
            </tbody>
          </table>
        </li>
      </ul>
      <p class="nota">Cuenta los pedidos sin aprobación, en espera y aprobados (despachados incluidos). Los no aprobados y anulados no suman.</p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.bloque { margin-bottom: 24px;
  &__titulo { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 0.95rem; font-weight: 800; color: var(--text);
    i { color: $primary; font-size: 0.85rem; } } }
.vacio { padding: 14px 16px; border: 1px dashed var(--border-strong); border-radius: var(--radius);
  font-family: $font-secondary; font-size: 0.8rem; color: var(--text-soft); }
.nota { margin-top: 10px; font-family: $font-secondary; font-size: 0.7rem; color: var(--text-faint); }

.cupos { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr)); }
.cupo { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-card); overflow: hidden;
  &__head { padding: 12px 14px; border-bottom: 1px solid var(--border);
    strong { display: block; font-size: 0.88rem; font-weight: 800; }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-faint); } }
  &__lista { list-style: none; }
  &__fila { display: grid; grid-template-columns: minmax(0, 1fr) 72px; grid-template-areas: 'nombre falta' 'barra falta';
    gap: 6px 12px; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border);
    &:last-child { border-bottom: none; } }
  &__nombre { grid-area: nombre; min-width: 0;
    span { display: block; font-size: 0.82rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-soft); }
    .pasado { color: $alert-error; } }
  &__barra { grid-area: barra; height: 6px; border-radius: 999px; background: rgba($primary-dark, 0.08); overflow: hidden;
    span { display: block; height: 100%; border-radius: inherit; background: $secondary; transition: width 0.4s var(--ease-out);
      &.is-casi { background: $alert-warning; }
      &.is-lleno { background: $alert-error; } } }
  &__falta { grid-area: falta; text-align: right;
    b { display: block; font-size: 1.05rem; font-weight: 800; font-variant-numeric: tabular-nums; color: darken($secondary, 12%); }
    small { font-family: $font-secondary; font-size: 0.66rem; color: var(--text-faint); }
    &.is-cero b { color: $alert-error; } }
}

.fila { display: flex; align-items: center; gap: 8px; overflow-x: auto; padding-bottom: 2px; margin-bottom: 10px;
  &__ico { flex-shrink: 0; color: var(--text-faint); font-size: 0.85rem; } }
.chip { flex-shrink: 0; min-height: 38px; padding: 7px 14px; border: 1.5px solid var(--border-strong); border-radius: 999px;
  background: var(--surface); cursor: pointer; white-space: nowrap; font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; color: var(--text);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: $primary; color: $white; } }
.fechas { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;
  label { display: flex; align-items: center; gap: 8px; font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; } }
.fechas input, .select { min-height: 40px; padding: 6px 10px; border: 1.5px solid var(--border-strong); border-radius: 8px;
  background: var(--surface); color: var(--text); font-family: $font-secondary; font-size: 0.8rem;
  &:focus { outline: none; border-color: $primary; } }
.filtros { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;
  .select { flex: 0 1 240px; min-width: 0; } }
.buscar { flex: 1 1 240px; display: flex; align-items: center; gap: 10px; padding: 0 14px; min-height: 42px;
  border: 1.5px solid var(--border-strong); border-radius: 10px; background: var(--surface);
  &:focus-within { border-color: $primary; }
  i { color: var(--text-faint); font-size: 0.85rem; }
  input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: var(--text);
    font-family: $font-secondary; font-size: 0.85rem; padding: 9px 0; } }
.resumen { margin-bottom: 12px; padding: 10px 14px; border-radius: 10px; background: var(--accent-soft); color: $primary;
  font-family: $font-secondary; font-size: 0.8rem;
  b { font-weight: 800; margin-left: 4px; } }

.asesores { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.asesor { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-card); overflow: hidden;
  &__head { width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 16px; border: none; background: transparent;
    text-align: left; cursor: pointer; color: var(--text);
    &:hover { background: rgba($primary, 0.02); } }
  &__nombre { flex: 1; min-width: 0;
    strong { display: block; font-size: 0.88rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); } }
  &__total { font-size: 0.95rem; font-weight: 800; font-variant-numeric: tabular-nums; }
  &__caret { font-size: 0.7rem; color: var(--text-faint); transition: transform 0.2s var(--ease-out);
    &.is-open { transform: rotate(180deg); } }
}
.tabla { width: 100%; border-collapse: collapse; border-top: 1px solid var(--border); font-family: $font-secondary; font-size: 0.8rem;
  th { padding: 8px 16px; text-align: left; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); }
  td { padding: 9px 16px; border-top: 1px solid var(--border); vertical-align: top;
    small { display: block; font-size: 0.68rem; color: var(--text-faint); } }
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  @media (max-width: 480px) { th, td { padding-left: 12px; padding-right: 12px; } }
}
</style>
