<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

/** Pide el motivo del rechazo en un modal propio (nunca window.prompt). */
const props = defineProps<{ open: boolean; numero: string; loading: boolean; error: string }>()
const emit = defineEmits<{ confirm: [motivo: string]; cancel: [] }>()

const motivo = ref('')
watch(
  () => props.open,
  (o) => {
    if (o) motivo.value = ''
  },
)

function enviar() {
  const m = motivo.value.trim()
  if (m && !props.loading) emit('confirm', m)
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('cancel')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="motivo-titulo">
          <header class="modal__head">
            <div>
              <h2 id="motivo-titulo">Rechazar solicitud {{ numero }}</h2>
              <p class="modal__hint">El vendedor verá este motivo, podrá corregir la solicitud y volver a enviarla.</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('cancel')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <form @submit.prevent="enviar">
            <label class="field">
              <span>Motivo del rechazo</span>
              <textarea
                id="motivo-rechazo"
                v-model="motivo"
                rows="4"
                class="motivo"
                placeholder="Ej.: la planilla de servicio básico tiene más de 3 meses"
              ></textarea>
            </label>

            <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

            <div class="modal__actions">
              <div class="modal__btns">
                <button type="button" class="modal__cancel" @click="emit('cancel')">Cancelar</button>
                <button type="submit" class="modal__save" :disabled="!motivo.trim() || loading">
                  <BaseSpinner v-if="loading" :size="14" light />
                  Rechazar solicitud
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

.motivo {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  font-family: $font-secondary;
  font-size: 0.88rem;
  color: var(--text);
  background: var(--surface);
  resize: vertical;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
</style>
