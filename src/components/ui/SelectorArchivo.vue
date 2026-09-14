<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue'

/**
 * Dos botones para adjuntar: cámara directa y galería/PDF.
 * Van separados a propósito: en muchos Android un input con `multiple`
 * no ofrece la cámara, así que "Tomar foto" nunca lleva `multiple`.
 */
withDefaults(
  defineProps<{
    /** Texto mientras sube (reemplaza los botones). */
    progreso?: string
    textoFoto?: string
    textoGaleria?: string
  }>(),
  { progreso: '', textoFoto: 'Tomar foto', textoGaleria: 'Galería o PDF' },
)
const emit = defineEmits<{ elegir: [files: File[]] }>()

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (files.length) emit('elegir', files)
}
</script>

<template>
  <p v-if="progreso" class="sa sa--busy" role="status">
    <BaseSpinner :size="16" /> {{ progreso }}
  </p>
  <div v-else class="sa">
    <label class="sa__btn is-foto">
      <input type="file" accept="image/*" capture="environment" @change="onChange" />
      <i class="fa-solid fa-camera" aria-hidden="true"></i> {{ textoFoto }}
    </label>
    <label class="sa__btn">
      <input type="file" accept="image/*,application/pdf" multiple @change="onChange" />
      <i class="fa-solid fa-images" aria-hidden="true"></i> {{ textoGaleria }}
    </label>
  </div>
</template>

<style lang="scss" scoped>
.sa {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &--busy {
    align-items: center;
    justify-content: center;
    min-height: 50px;
    border: 1.5px dashed var(--border-strong);
    border-radius: 11px;
    font-family: $font-secondary;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text-soft);
  }

  &__btn {
    position: relative;
    flex: 1 1 140px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 50px;
    padding: 0 12px;
    border: 1.5px solid $primary;
    border-radius: 11px;
    background: var(--surface);
    color: $primary;
    font-family: $font-secondary;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease;

    input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
    i { font-size: 1rem; }
    &:hover { background: var(--accent-soft); }
    &:focus-within { box-shadow: 0 0 0 3px rgba($primary, 0.25); }

    &.is-foto {
      background: $primary;
      color: $white;
      &:hover { background: darken($primary, 6%); }
    }
  }
}
</style>
