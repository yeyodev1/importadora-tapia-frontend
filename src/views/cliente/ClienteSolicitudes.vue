<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { solicitudesService } from '@/services/solicitudes.service'
import { ESTADO_LABEL, ESTADO_TONE } from '../solicitudes/documentos'
import { formatDate } from '@/utils/format'
import type { SolicitudCredito } from '@/types/solicitudes'
import type { ApiError } from '@/types'

/** Solicitudes y documentos relacionados con este cliente del ERP. */
const props = defineProps<{ codigo: string }>()

const lista = ref<SolicitudCredito[]>([])
const cargando = ref(false)
const error = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    lista.value = await solicitudesService.list(props.codigo)
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudieron cargar las solicitudes'
  } finally {
    cargando.value = false
  }
}

watch(() => props.codigo, cargar, { immediate: true })
</script>

<template>
  <section class="cs">
    <header class="cs__head">
      <h2>Solicitud de crédito y documentos <small>{{ lista.length }}</small></h2>
      <RouterLink :to="{ path: '/solicitudes/nueva', query: { tipo: 'actualizacion', cliente: codigo } }" class="cs__nueva">
        <i class="fa-solid fa-file-signature"></i> Actualizar datos
      </RouterLink>
    </header>

    <p v-if="cargando" class="cs__msg"><BaseSpinner :size="12" /> Cargando…</p>
    <p v-else-if="error" class="cs__msg is-error">
      {{ error }} <button type="button" class="cs__retry" @click="cargar">Reintentar</button>
    </p>
    <p v-else-if="!lista.length" class="cs__msg">
      Este cliente todavía no tiene solicitud ni documentos en el CRM.
    </p>

    <ul v-else class="cs__lista">
      <li v-for="s in lista" :key="s._id">
        <RouterLink :to="`/solicitudes/${s._id}`" class="cs__item">
          <span class="cs__txt">
            <b>{{ s.numero }}</b> · {{ s.tipo === 'nuevo' ? 'Cliente nuevo' : 'Actualización' }} · {{ s.documentos.length }} archivos
            <small>{{ formatDate(s.updatedAt) }}</small>
          </span>
          <BaseBadge :tone="ESTADO_TONE[s.estado]">{{ ESTADO_LABEL[s.estado] }}</BaseBadge>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.cs {
  display: flex; flex-direction: column; gap: 10px; padding: 16px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-card);

  &__head {
    display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
    h2 {
      font-size: 0.92rem; font-weight: 800;
      small { font-family: $font-secondary; font-size: 0.7rem; color: $primary; background: var(--accent-soft); border-radius: 999px; padding: 2px 8px; margin-left: 4px; }
    }
  }
  &__nueva {
    display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border-radius: 8px;
    background: var(--accent-soft); color: $primary; font-family: $font-secondary; font-size: 0.78rem; font-weight: 700; text-decoration: none;
    &:hover { background: rgba($primary, 0.2); }
  }
  &__msg {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft);
    &.is-error { color: darken($alert-error, 8%); }
  }
  &__retry { border: none; background: none; padding: 0; font: inherit; font-weight: 700; color: $primary; text-decoration: underline; cursor: pointer; }
  &__lista { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  &__item {
    display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 48px; padding: 8px 12px;
    border: 1px solid var(--border); border-radius: 9px; color: var(--text); text-decoration: none;
    &:hover { border-color: $primary; }
  }
  &__txt {
    display: flex; flex-direction: column; min-width: 0; font-family: $font-secondary; font-size: 0.8rem;
    small { font-size: 0.68rem; color: var(--text-faint); }
  }
}
</style>
