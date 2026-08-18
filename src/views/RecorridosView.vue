<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVisitasStore } from '@/stores/visitas'
import { useUserStore } from '@/stores/user'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import RouteMap from '@/components/ui/RouteMap.vue'

const visitas = useVisitasStore()
const userStore = useUserStore()

const hoy = new Date().toISOString().slice(0, 10)
const fecha = ref(hoy)
const vendedor = ref('todos')

onMounted(() => visitas.fetch())

/** Vendedores presentes en las visitas (para el filtro del admin). */
const vendedores = computed(() => {
  const set = new Set(visitas.data.map((v) => v.vendedorNombre))
  return [...set].sort()
})

/** Visitas del día seleccionado (y vendedor, si admin), ordenadas por hora. */
const delDia = computed(() => {
  return visitas.data
    .filter((v) => v.createdAt.slice(0, 10) === fecha.value)
    .filter((v) => vendedor.value === 'todos' || v.vendedorNombre === vendedor.value)
    .sort((a, b) => a.entrada.ts.localeCompare(b.entrada.ts))
})

const paradas = computed(() =>
  delDia.value.map((v, i) => ({
    lat: v.entrada.lat,
    lng: v.entrada.lng,
    label: v.clienteNombre || `Parada ${i + 1}`,
    hora: hora(v.entrada.ts),
  })),
)

const tiempoTotal = computed(() =>
  delDia.value.reduce((s, v) => s + (v.duracionMin || 0), 0),
)

const inicioFin = computed(() => {
  const list = delDia.value
  if (!list.length) return '—'
  const primero = list[0]
  const ultimo = list[list.length - 1]
  if (!primero || !ultimo) return '—'
  const fin = ultimo.salida ? hora(ultimo.salida.ts) : 'en curso'
  return `${hora(primero.entrada.ts)} → ${fin}`
})

function hora(ts: string) {
  return new Date(ts).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

/** Minutos de traslado entre la salida de la parada i-1 y la llegada de la i. */
function trasladoDe(i: number): number | null {
  const prev = delDia.value[i - 1]
  const actual = delDia.value[i]
  if (!prev?.salida || !actual) return null
  const diff = (new Date(actual.entrada.ts).getTime() - new Date(prev.salida.ts).getTime()) / 60000
  return diff > 0 ? Math.round(diff) : null
}

const resultadoLabel: Record<string, string> = {
  atendido: 'Atendido',
  espera: 'Esperó',
  regreso: 'Regresar',
  abandono: 'No atendido',
}
</script>

<template>
  <div>
    <PageHeader
      title="Recorridos"
      subtitle="La ruta que hizo cada vendedor en el día, con tiempos entre visitas."
      source="local"
      :refreshing="visitas.loading && !!visitas.fetchedAt"
      @refresh="visitas.fetch(true)"
    >
      <template #actions>
        <input v-model="fecha" type="date" class="filtro" :max="hoy" />
        <select v-if="userStore.isAdmin" v-model="vendedor" class="filtro">
          <option value="todos">Todos los vendedores</option>
          <option v-for="v in vendedores" :key="v" :value="v">{{ v }}</option>
        </select>
      </template>
    </PageHeader>

    <EmptyState
      v-if="!delDia.length"
      title="Sin recorrido este día"
      message="No hay visitas registradas para la fecha seleccionada."
    />

    <template v-else>
      <div class="resumen">
        <div class="resumen__item"><span>Paradas</span><b>{{ delDia.length }}</b></div>
        <div class="resumen__item"><span>Tiempo en clientes</span><b>{{ tiempoTotal }} min</b></div>
        <div class="resumen__item">
          <span>Inicio → fin</span>
          <b>{{ inicioFin }}</b>
        </div>
      </div>

      <RouteMap :paradas="paradas" class="mapa" />

      <ol class="paradas">
        <li v-for="(v, i) in delDia" :key="v._id">
          <div v-if="i > 0 && trasladoDe(i)" class="traslado">
            <i class="fa-solid fa-car"></i> {{ trasladoDe(i) }} min de traslado
          </div>
          <div class="parada">
            <span class="parada__n">{{ i + 1 }}</span>
            <div class="parada__info">
              <strong>{{ v.clienteNombre || 'Cliente sin nombre' }}</strong>
              <small>
                Llegó {{ hora(v.entrada.ts) }}<template v-if="v.salida"> · Salió {{ hora(v.salida.ts) }}</template>
                <template v-if="v.duracionMin"> · {{ v.duracionMin }} min</template>
              </small>
            </div>
            <BaseBadge v-if="v.estado === 'en_curso'" tone="info">En curso</BaseBadge>
            <BaseBadge v-else-if="v.resultado" :tone="v.resultado === 'atendido' ? 'success' : v.resultado === 'abandono' ? 'danger' : 'warning'">
              {{ resultadoLabel[v.resultado] }}
            </BaseBadge>
          </div>
        </li>
      </ol>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.filtro {
  padding: 8px 12px; border: 1px solid var(--border-strong); border-radius: 8px;
  font-family: $font-secondary; font-size: 0.82rem; color: var(--text); background: var(--surface);
  &:focus { outline: none; border-color: $primary; }
}
.resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
  &__item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-card); padding: 16px 18px;
    span { font-family: $font-secondary; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); }
    b { display: block; margin-top: 5px; font-size: 1.25rem; font-weight: 800; font-variant-numeric: tabular-nums; } }
}
.mapa { margin-bottom: 18px; }
.paradas { list-style: none; padding: 0;
  .traslado { display: flex; align-items: center; gap: 7px; margin: 4px 0 4px 30px; padding: 4px 0;
    font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint);
    i { opacity: 0.7; } }
  .parada { display: flex; align-items: center; gap: 12px;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-card); padding: 12px 14px;
    &__n { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      background: $primary; color: $white; font-family: $font-principal; font-size: 0.76rem; font-weight: 800; }
    &__info { flex: 1; min-width: 0;
      strong { display: block; font-size: 0.86rem; font-weight: 700; }
      small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); } } }
}
</style>
