<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import { useSolicitudesStore } from '@/stores/solicitudes'
import { useUserStore } from '@/stores/user'
import { ESTADO_LABEL, ESTADO_TONE } from './solicitudes/documentos'
import { formatDate } from '@/utils/format'
import type { SolicitudCredito } from '@/types/solicitudes'

const store = useSolicitudesStore()
const userStore = useUserStore()
const router = useRouter()

onMounted(() => store.fetch(true))

type Filtro = 'todas' | 'enviada' | 'borrador' | 'aprobada' | 'rechazada' | 'sin_relacionar'
const filtro = ref<Filtro>('todas')

function coincide(s: SolicitudCredito, v: Filtro) {
  if (v === 'todas') return true
  if (v === 'sin_relacionar') return !s.clienteCodigo && s.estado !== 'borrador'
  return s.estado === v
}

const filtros = computed(() => {
  const base: { v: Filtro; label: string }[] = [
    { v: 'todas', label: 'Todas' },
    { v: 'enviada', label: 'En revisión' },
    { v: 'borrador', label: 'Borradores' },
    { v: 'aprobada', label: 'Aprobadas' },
    { v: 'rechazada', label: 'Rechazadas' },
  ]
  if (userStore.isAdmin) base.push({ v: 'sin_relacionar', label: 'Sin relacionar al ERP' })
  return base.map((f) => ({ ...f, n: store.data.filter((s) => coincide(s, f.v)).length }))
})

const lista = computed(() => store.data.filter((s) => coincide(s, filtro.value)))

const nombre = (s: SolicitudCredito) =>
  [s.titular.nombres, s.titular.apellidos].filter(Boolean).join(' ') || s.negocio.nombre || 'Sin nombre'
</script>

<template>
  <div>
    <PageHeader
      title="Solicitudes de crédito"
      subtitle="Clientes nuevos y actualización de datos, con sus documentos."
      source="local"
      :count="store.fetchedAt ? store.data.length : null"
      :refreshing="store.loading && !!store.fetchedAt"
      @refresh="store.fetch(true)"
    >
      <template #actions>
        <button class="nueva" type="button" @click="router.push('/solicitudes/nueva')">
          <i class="fa-solid fa-user-plus"></i> Nuevo cliente
        </button>
      </template>
    </PageHeader>

    <div class="filtros" role="group" aria-label="Filtrar solicitudes">
      <button
        v-for="fl in filtros"
        :key="fl.v"
        type="button"
        class="filtro"
        :class="{ 'is-active': filtro === fl.v }"
        :aria-pressed="filtro === fl.v"
        @click="filtro = fl.v"
      >
        {{ fl.label }} <span>{{ fl.n }}</span>
      </button>
    </div>

    <SkeletonTable v-if="store.loading && !store.fetchedAt" :cols="3" :rows="5" />
    <EmptyState v-else-if="store.error" tone="error" title="No se pudo cargar" :message="store.error" @retry="store.fetch(true)" />
    <EmptyState
      v-else-if="!store.data.length"
      title="Sin solicitudes todavía"
      message="Toca «Nuevo cliente» para llenar la solicitud de crédito y subir sus documentos. Para un cliente que ya existe, usa «Actualizar datos» en su ficha."
    />
    <EmptyState v-else-if="!lista.length" title="Nada en este filtro" message="Elige otro filtro para ver más solicitudes." />

    <ul v-else class="lista">
      <li v-for="(s, i) in lista" :key="s._id" class="stagger-item" :style="{ '--i': i }">
        <button type="button" class="sol" @click="router.push(`/solicitudes/${s._id}`)">
          <span class="sol__info">
            <strong>{{ nombre(s) }} <code>{{ s.numero }}</code></strong>
            <small>
              {{ s.tipo === 'nuevo' ? 'Cliente nuevo' : 'Actualización de datos' }}
              <template v-if="s.negocio.nombre"> · {{ s.negocio.nombre }}</template>
              · {{ formatDate(s.updatedAt) }}
              <template v-if="userStore.isAdmin"> · {{ s.vendedorNombre }}</template>
            </small>
            <span class="tags">
              <span class="tag"><i class="fa-solid fa-paperclip"></i> {{ s.documentos.length }} archivos</span>
              <span class="tag" :class="s.clienteCodigo ? 'is-ok' : 'is-pend'">
                <i class="fa-solid fa-link"></i>
                {{ s.clienteCodigo ? `ERP ${s.clienteCodigo}` : 'Sin relacionar al ERP' }}
              </span>
            </span>
          </span>
          <BaseBadge :tone="ESTADO_TONE[s.estado]">{{ ESTADO_LABEL[s.estado] }}</BaseBadge>
        </button>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.nueva {
  display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 16px; border: none; border-radius: 8px;
  background: $primary; color: $white; font-family: $font-principal; font-size: 0.8rem; font-weight: 700; cursor: pointer;
  &:hover { background: darken($primary, 6%); }
}
.filtros { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 14px; }
.filtro {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 0 13px;
  border: 1px solid var(--border-strong); border-radius: 999px; background: var(--surface);
  font-family: $font-secondary; font-size: 0.76rem; font-weight: 600; color: var(--text-soft); cursor: pointer;
  span { font-size: 0.68rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: rgba($primary-dark, 0.06); }
  &:hover { border-color: $primary; color: $primary; }
  &.is-active { background: $primary; border-color: $primary; color: $white; span { background: rgba($white, 0.22); } }
}
.lista { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.sol {
  width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 16px;
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-card);
  text-align: left; cursor: pointer; transition: border-color 0.2s ease;
  &:hover { border-color: rgba($primary, 0.4); }
  &__info {
    display: flex; flex-direction: column; gap: 3px; min-width: 0;
    strong { font-size: 0.88rem; font-weight: 700; color: var(--text); }
    code { font-family: $font-secondary; font-size: 0.66rem; font-weight: 700; color: $primary; background: var(--accent-soft); border-radius: 5px; padding: 1px 6px; margin-left: 4px; }
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); }
  }
}
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
.tag {
  display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 6px;
  font-family: $font-secondary; font-size: 0.68rem; font-weight: 600; color: var(--text-soft); background: rgba($primary-dark, 0.05);
  &.is-ok { color: darken($secondary, 15%); background: rgba($secondary, 0.12); }
  &.is-pend { color: darken($alert-warning, 22%); background: $alert-warning-bg; }
}
</style>
