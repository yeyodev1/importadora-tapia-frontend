<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import type { ResultadoVisita } from '@/types/erp'

/** Confirma la salida de la visita con observación opcional (reemplaza window.prompt). */
const props = defineProps<{
  resultado: ResultadoVisita | null
  cliente: string
  loading: boolean
  error: string
}>()
const emit = defineEmits<{ confirm: [observacion?: string]; cancel: [] }>()

const observacion = ref('')

const TEXTO: Record<ResultadoVisita, { emoji: string; label: string; ayuda: string }> = {
  atendido: { emoji: '✅', label: 'Atendido', ayuda: 'Te atendieron.' },
  espera: { emoji: '⏳', label: 'Esperó', ayuda: 'Tuviste que esperar para que te atiendan.' },
  regreso: { emoji: '🔁', label: 'Debe regresar', ayuda: 'Hay que volver otro día.' },
  abandono: { emoji: '🚫', label: 'No atendido', ayuda: 'No te recibieron.' },
}

watch(
  () => props.resultado,
  (r) => {
    if (r) observacion.value = ''
  },
)

function confirmar() {
  if (!props.loading) emit('confirm', observacion.value.trim() || undefined)
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="resultado" class="modal-backdrop" @click.self="emit('cancel')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="salida-titulo">
          <header class="modal__head">
            <div>
              <h2 id="salida-titulo">🚪 Marcar salida</h2>
              <p class="modal__hint">{{ cliente || 'Cliente sin nombre' }} · se guarda tu ubicación y la hora exacta.</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('cancel')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <p class="resultado">
            <span aria-hidden="true">{{ TEXTO[resultado].emoji }}</span>
            <strong>{{ TEXTO[resultado].label }}</strong>
            <small>{{ TEXTO[resultado].ayuda }}</small>
          </p>

          <form @submit.prevent="confirmar">
            <label class="field">
              <span>Observación (opcional)</span>
              <textarea
                id="salida-observacion"
                v-model="observacion"
                rows="3"
                class="obs"
                placeholder="Ej.: el dueño regresa el jueves"
              ></textarea>
            </label>

            <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

            <div class="modal__actions">
              <div class="modal__btns">
                <button type="button" class="modal__cancel" @click="emit('cancel')">Cancelar</button>
                <button type="submit" class="modal__save" :disabled="loading">
                  <BaseSpinner v-if="loading" :size="14" light />
                  Marcar salida
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../equipo/form-modal';

.resultado {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; margin: 4px 0 12px; padding: 12px 14px;
  border-radius: 10px; background: var(--accent-soft);
  span { font-size: 1.4rem; }
  strong { font-size: 0.95rem; font-weight: 800; }
  small { flex-basis: 100%; font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); }
}
.obs {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
  font-family: $font-secondary; font-size: 0.88rem; color: var(--text); background: var(--surface); resize: vertical;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
</style>
