<script setup lang="ts">
import { ref } from 'vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import MotivoRechazoModal from './MotivoRechazoModal.vue'
import VincularClienteModal from './VincularClienteModal.vue'
import { solicitudesService } from '@/services/solicitudes.service'
import { formatDate } from '@/utils/format'
import type { SolicitudCredito } from '@/types/solicitudes'
import type { ApiError } from '@/types'

/** Acciones de administración: aprobar, rechazar y relacionar con el ERP. */
const props = defineProps<{ solicitud: SolicitudCredito }>()
const emit = defineEmits<{ actualizada: [s: SolicitudCredito] }>()

const modal = ref<'aprobar' | 'rechazar' | 'vincular' | null>(null)
const trabajando = ref(false)
const error = ref('')

function abrir(m: 'aprobar' | 'rechazar' | 'vincular') {
  error.value = ''
  modal.value = m
}

async function ejecutar(accion: () => Promise<SolicitudCredito>) {
  trabajando.value = true
  error.value = ''
  try {
    emit('actualizada', await accion())
    modal.value = null
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo completar la acción'
  } finally {
    trabajando.value = false
  }
}

const aprobar = () => ejecutar(() => solicitudesService.setEstado(props.solicitud._id, 'aprobada'))
const rechazar = (motivo: string) => ejecutar(() => solicitudesService.setEstado(props.solicitud._id, 'rechazada', motivo))
const vincular = (codigo: string) => ejecutar(() => solicitudesService.vincular(props.solicitud._id, codigo))
</script>

<template>
  <section class="panel">
    <div class="panel__fila">
      <div class="panel__txt">
        <strong>Revisión de administración</strong>
        <small v-if="solicitud.estado === 'enviada'">
          Enviada el {{ formatDate(solicitud.enviadaAt || solicitud.updatedAt) }} por {{ solicitud.vendedorNombre }}.
        </small>
        <small v-else-if="solicitud.revisadoPor">
          {{ solicitud.estado === 'aprobada' ? 'Aprobada' : 'Rechazada' }} por {{ solicitud.revisadoPor }}
          el {{ formatDate(solicitud.revisadoAt || solicitud.updatedAt) }}.
        </small>
        <small v-else>El vendedor aún no la envía a revisión.</small>
      </div>
      <div v-if="solicitud.estado === 'enviada'" class="panel__btns">
        <button type="button" class="btn is-ok" @click="abrir('aprobar')"><i class="fa-solid fa-check"></i> Aprobar</button>
        <button type="button" class="btn is-no" @click="abrir('rechazar')"><i class="fa-solid fa-xmark"></i> Rechazar</button>
      </div>
    </div>

    <div class="panel__fila">
      <div class="panel__txt">
        <strong>Cliente en el ERP</strong>
        <small v-if="solicitud.clienteCodigo">
          Relacionada con <b>{{ solicitud.clienteNombre }}</b> (código {{ solicitud.clienteCodigo }}).
        </small>
        <small v-else>Sin relacionar. Cuando Tapia cree el cliente en su sistema, relaciónalo aquí.</small>
      </div>
      <div class="panel__btns">
        <RouterLink v-if="solicitud.clienteCodigo" :to="`/clientes/${solicitud.clienteCodigo}`" class="btn">
          <i class="fa-solid fa-address-card"></i> Ver ficha
        </RouterLink>
        <button type="button" class="btn" @click="abrir('vincular')">
          <i class="fa-solid fa-link"></i> {{ solicitud.clienteCodigo ? 'Cambiar' : 'Relacionar' }}
        </button>
      </div>
    </div>

    <ConfirmModal
      :open="modal === 'aprobar'"
      title="Aprobar solicitud de crédito"
      :subject="solicitud.numero"
      message="Se le avisará al vendedor por correo que la solicitud fue aprobada."
      confirm-label="Aprobar"
      :loading="trabajando"
      :error="error"
      @cancel="modal = null"
      @confirm="aprobar"
    />
    <MotivoRechazoModal
      :open="modal === 'rechazar'"
      :numero="solicitud.numero"
      :loading="trabajando"
      :error="error"
      @cancel="modal = null"
      @confirm="rechazar"
    />
    <VincularClienteModal
      :open="modal === 'vincular'"
      :solicitud="solicitud"
      :loading="trabajando"
      :error="error"
      @cancel="modal = null"
      @confirm="vincular"
    />
  </section>
</template>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba($primary, 0.3);
  border-radius: var(--radius);
  background: var(--accent-soft);

  &__fila {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    & + & { border-top: 1px solid rgba($primary, 0.18); }

    @media (min-width: 640px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  &__txt {
    display: flex; flex-direction: column; gap: 2px; min-width: 0;
    strong { font-size: 0.86rem; font-weight: 800; }
    small { font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); b { color: var(--text); } }
  }

  &__btns { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
}

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 42px; padding: 0 14px;
  border: 1px solid var(--border-strong); border-radius: 9px; background: var(--surface); color: var(--text);
  font-family: $font-principal; font-size: 0.8rem; font-weight: 700; text-decoration: none; cursor: pointer;
  &:hover { border-color: $primary; color: $primary; }
  &.is-ok { background: $secondary; border-color: $secondary; color: $white; &:hover { background: darken($secondary, 6%); color: $white; } }
  &.is-no:hover { border-color: $alert-error; color: $alert-error; background: $alert-error-bg; }
}
</style>
