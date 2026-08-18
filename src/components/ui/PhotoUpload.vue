<script setup lang="ts">
import { ref } from 'vue'
import BaseSpinner from './BaseSpinner.vue'
import { fileToCompressedDataUri } from '@/utils/image'

withDefaults(defineProps<{ label?: string }>(), { label: 'Tomar foto o elegir imagen' })
const model = defineModel<string>({ default: '' })

const preparing = ref(false)
const fileName = ref('')
const error = ref('')

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  preparing.value = true
  error.value = ''
  try {
    model.value = await fileToCompressedDataUri(file)
    fileName.value = file.name
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    preparing.value = false
  }
}

function quitar() {
  model.value = ''
  fileName.value = ''
}
</script>

<template>
  <div class="photo">
    <label class="photo__drop" :class="{ 'has-file': model }">
      <input type="file" accept="image/*" capture="environment" @change="onFile" />
      <BaseSpinner v-if="preparing" :size="18" />
      <template v-else-if="model">
        <img :src="model" alt="Imagen adjunta" />
        <span>{{ fileName || 'Imagen lista' }} · toca para cambiar</span>
      </template>
      <template v-else>
        <i class="fa-solid fa-camera"></i>
        <span>{{ label }}</span>
      </template>
    </label>
    <button v-if="model" type="button" class="photo__x" @click="quitar">Quitar</button>
    <p v-if="error" class="photo__err">{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.photo {
  &__drop {
    position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; min-height: 96px; padding: 14px; border: 1.5px dashed var(--border-strong);
    border-radius: 11px; cursor: pointer; color: var(--text-faint); transition: border-color 0.2s ease;
    input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    i { font-size: 1.4rem; }
    span { font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; text-align: center; }
    img { max-height: 110px; border-radius: 8px; }
    &:hover { border-color: $primary; }
    &.has-file { border-style: solid; border-color: $secondary; color: darken($secondary, 12%); }
  }
  &__x { margin-top: 6px; border: none; background: transparent; color: $alert-error;
    font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; cursor: pointer; }
  &__err { margin-top: 6px; font-family: $font-secondary; font-size: 0.74rem; color: $alert-error; }
}
</style>
