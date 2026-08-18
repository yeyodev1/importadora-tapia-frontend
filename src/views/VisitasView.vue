<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVisitasStore } from '@/stores/visitas'
import { useUserStore } from '@/stores/user'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { formatDate } from '@/utils/format'
import type { ResultadoVisita } from '@/types/erp'

const visitas = useVisitasStore()
const userStore = useUserStore()

const cliente = ref('')
const trabajando = ref(false)
const error = ref('')

onMounted(() => visitas.fetch())

const enCurso = computed(() => visitas.enCurso)

async function llegar() {
  if (trabajando.value) return
  error.value = ''
  trabajando.value = true
  try {
    await visitas.registrarLlegada({ nombre: cliente.value || undefined })
    cliente.value = ''
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    trabajando.value = false
  }
}

async function salir(resultado: ResultadoVisita) {
  if (trabajando.value || !enCurso.value) return
  error.value = ''
  trabajando.value = true
  try {
    let obs: string | undefined
    if (resultado !== 'atendido') {
      obs = window.prompt('Observación (opcional):') || undefined
    }
    await visitas.marcarSalida(enCurso.value._id, resultado, obs)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    trabajando.value = false
  }
}

const resultadoTone: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  atendido: 'success',
  espera: 'warning',
  regreso: 'neutral',
  abandono: 'danger',
}
const resultadoLabel: Record<string, string> = {
  atendido: 'Atendido',
  espera: 'Esperó',
  regreso: 'Debe regresar',
  abandono: 'No atendido',
}

function hora(ts?: string) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}
function mapUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
</script>

<template>
  <div>
    <PageHeader
      title="Visitas"
      subtitle="Registro de visitas con ubicación. Marca tu llegada y tu salida en cada cliente."
      source="local"
      :count="visitas.fetchedAt ? visitas.data.length : null"
      :refreshing="visitas.loading && !!visitas.fetchedAt"
      @refresh="visitas.fetch(true)"
    />

    <!-- Panel de acción: llegada o salida -->
    <section v-if="!userStore.isAdmin" class="accion">
      <template v-if="!enCurso">
        <label class="accion__cliente">
          <span>Cliente (opcional)</span>
          <input v-model="cliente" type="text" placeholder="Nombre del cliente que visitas" />
        </label>
        <button class="accion__btn is-llegar" type="button" :disabled="trabajando" @click="llegar">
          <BaseSpinner v-if="trabajando" :size="16" light />
          <i v-else class="fa-solid fa-location-dot"></i>
          Registrar llegada
        </button>
        <p class="accion__hint"><i class="fa-solid fa-circle-info"></i> Se guardará tu ubicación GPS actual.</p>
      </template>

      <template v-else>
        <div class="accion__encurso">
          <span class="accion__badge"><i class="fa-solid fa-location-crosshairs"></i> Visita en curso</span>
          <strong>{{ enCurso.clienteNombre || 'Cliente sin nombre' }}</strong>
          <small>Llegaste a las {{ hora(enCurso.entrada.ts) }}</small>
        </div>
        <p class="accion__salida-lbl">Marca tu salida:</p>
        <div class="accion__salidas">
          <button type="button" class="s ok" :disabled="trabajando" @click="salir('atendido')">Atendido</button>
          <button type="button" class="s wa" :disabled="trabajando" @click="salir('espera')">Esperó</button>
          <button type="button" class="s ne" :disabled="trabajando" @click="salir('regreso')">Regresar</button>
          <button type="button" class="s da" :disabled="trabajando" @click="salir('abandono')">No atendido</button>
        </div>
      </template>

      <p v-if="error" class="accion__err" role="alert">{{ error }}</p>
    </section>

    <SkeletonTable v-if="visitas.loading && !visitas.fetchedAt" :cols="4" :rows="6" />
    <EmptyState
      v-else-if="visitas.error"
      tone="error"
      title="No se pudo cargar"
      :message="visitas.error"
      @retry="visitas.fetch(true)"
    />
    <EmptyState
      v-else-if="!visitas.data.length"
      title="Sin visitas registradas"
      message="Registra tu primera visita con el botón de arriba."
    />

    <ul v-else class="lista">
      <li v-for="(v, i) in visitas.data" :key="v._id" class="visita stagger-item" :style="{ '--i': i }">
        <div class="visita__col">
          <strong>{{ v.clienteNombre || 'Cliente sin nombre' }}</strong>
          <small>
            {{ formatDate(v.createdAt) }} · {{ hora(v.entrada.ts) }}<template v-if="v.salida"> → {{ hora(v.salida.ts) }}</template>
            <template v-if="userStore.isAdmin"> · {{ v.vendedorNombre }}</template>
          </small>
          <a class="visita__mapa" :href="mapUrl(v.entrada.lat, v.entrada.lng)" target="_blank" rel="noopener">
            <i class="fa-solid fa-map-location-dot"></i> Ver ubicación
          </a>
        </div>
        <div class="visita__right">
          <span v-if="v.duracionMin" class="visita__dur">{{ v.duracionMin }} min</span>
          <BaseBadge v-if="v.estado === 'en_curso'" tone="info">En curso</BaseBadge>
          <BaseBadge v-else-if="v.resultado" :tone="resultadoTone[v.resultado]">
            {{ resultadoLabel[v.resultado] }}
          </BaseBadge>
          <BaseBadge v-else tone="neutral">Finalizada</BaseBadge>
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.accion {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow-card); padding: 20px; margin-bottom: 20px;
  &__cliente { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;
    span { font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; color: var(--text-soft); }
    input { padding: 11px 13px; border: 1px solid var(--border-strong); border-radius: 9px; font-family: $font-secondary; font-size: 0.9rem;
      &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); } } }
  &__btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 9px;
    padding: 15px; border: none; border-radius: 11px; font-family: $font-principal; font-size: 0.95rem; font-weight: 700; cursor: pointer;
    &.is-llegar { background: $secondary; color: $white; &:hover:not(:disabled) { background: darken($secondary, 6%); } }
    &:disabled { opacity: 0.8; } i { font-size: 1rem; } }
  &__hint { margin-top: 10px; font-family: $font-secondary; font-size: 0.74rem; color: var(--text-faint); text-align: center; }
  &__encurso { text-align: center; margin-bottom: 16px;
    strong { display: block; font-size: 1.05rem; font-weight: 800; margin-top: 8px; }
    small { font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft); } }
  &__badge { display: inline-flex; align-items: center; gap: 7px; font-family: $font-secondary; font-size: 0.74rem; font-weight: 700;
    padding: 5px 13px; border-radius: 999px; background: var(--accent-soft); color: $primary; }
  &__salida-lbl { font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; color: var(--text-soft); margin-bottom: 8px; text-align: center; }
  &__salidas { display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    .s { padding: 13px; border-radius: 10px; border: 1px solid var(--border-strong); background: var(--surface);
      font-family: $font-principal; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.18s ease;
      &.ok:hover { border-color: $secondary; color: darken($secondary,10%); background: rgba($secondary,0.08); }
      &.wa:hover { border-color: $alert-warning; color: darken($alert-warning,15%); background: $alert-warning-bg; }
      &.ne:hover { border-color: $primary; color: $primary; background: var(--accent-soft); }
      &.da:hover { border-color: $alert-error; color: $alert-error; background: $alert-error-bg; } } }
  &__err { margin-top: 12px; font-family: $font-secondary; font-size: 0.8rem; color: darken($alert-error,8%);
    background: $alert-error-bg; border-radius: 8px; padding: 10px 12px; text-align: center; }
}
.lista { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.visita { display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-card); padding: 14px 16px;
  &__col { min-width: 0;
    strong { display: block; font-size: 0.88rem; font-weight: 700; }
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); } }
  &__mapa { display: inline-flex; align-items: center; gap: 6px; margin-top: 5px; font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; color: $primary; text-decoration: none;
    &:hover { text-decoration: underline; } }
  &__right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  &__dur { font-family: $font-secondary; font-size: 0.72rem; font-weight: 700; color: var(--text-soft); }
}
</style>
