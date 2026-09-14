<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import BaseSpinner from './BaseSpinner.vue'

/** Recorte de foto a pantalla completa (táctil): se ajustan las esquinas, se gira y se sube. */
const props = defineProps<{ file: File | null; titulo?: string }>()
const emit = defineEmits<{ listo: [f: File]; cancelar: [] }>()

const img = ref<HTMLImageElement | null>(null)
const url = ref('')
const preparando = ref(false)
let cropper: Cropper | null = null

function limpiar() {
  cropper?.destroy()
  cropper = null
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = ''
}

watch(
  () => props.file,
  async (f) => {
    limpiar()
    if (!f) return
    url.value = URL.createObjectURL(f)
    await nextTick()
    if (!img.value) return
    cropper = new Cropper(img.value, {
      viewMode: 1,
      autoCropArea: 0.92,
      background: false,
      responsive: true,
      checkOrientation: true,
      toggleDragModeOnDblclick: false,
    })
  },
)

onBeforeUnmount(limpiar)

const rotar = () => cropper?.rotate(90)

function usarCompleta() {
  if (props.file) emit('listo', props.file)
}

function recortar() {
  if (!cropper || !props.file || preparando.value) return
  preparando.value = true
  const canvas = cropper.getCroppedCanvas({ maxWidth: 2400, maxHeight: 2400, fillColor: '#fff', imageSmoothingQuality: 'high' })
  canvas.toBlob(
    (blob) => {
      preparando.value = false
      if (!blob || !props.file) return usarCompleta()
      const nombre = `${props.file.name.replace(/\.[^.]+$/, '')}-recorte.jpg`
      emit('listo', new File([blob], nombre, { type: 'image/jpeg' }))
    },
    'image/jpeg',
    0.9,
  )
}
</script>

<template>
  <Teleport to="body">
    <div v-if="file" class="recorte" role="dialog" aria-modal="true" aria-labelledby="recorte-titulo">
      <header class="recorte__head">
        <h2 id="recorte-titulo">✂️ {{ titulo || 'Recorta la foto' }}</h2>
        <p>Mueve las esquinas para dejar solo el documento.</p>
      </header>

      <div class="recorte__area">
        <img ref="img" :src="url" alt="Foto a recortar" />
      </div>

      <div class="recorte__barra">
        <button type="button" class="recorte__btn" @click="rotar">
          <i class="fa-solid fa-rotate-right"></i> Girar
        </button>
        <button type="button" class="recorte__btn" @click="usarCompleta">Usar completa</button>
        <button type="button" class="recorte__btn is-pri" :disabled="preparando" @click="recortar">
          <BaseSpinner v-if="preparando" :size="14" light />
          <i v-else class="fa-solid fa-crop-simple"></i>
          Recortar y subir
        </button>
        <button type="button" class="recorte__cancelar" @click="emit('cancelar')">Cancelar</button>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.recorte {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  flex-direction: column;
  background: #0b1220;
  color: $white;
  padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));

  &__head {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 4px 10px;
    h2 { font-size: 1rem; font-weight: 800; }
    p { font-family: $font-secondary; font-size: 0.76rem; color: rgba($white, 0.7); }
  }

  &__area {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img { display: block; max-width: 100%; max-height: 100%; }
  }

  &__barra {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 12px;
  }

  &__btn {
    flex: 1 1 30%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 48px;
    padding: 0 12px;
    border: 1px solid rgba($white, 0.25);
    border-radius: 10px;
    background: rgba($white, 0.08);
    color: $white;
    font-family: $font-principal;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;

    &.is-pri { flex-basis: 100%; border: none; background: $primary; order: -1; }
    &:disabled { opacity: 0.7; cursor: wait; }
  }

  &__cancelar {
    flex: 1 1 30%;
    min-height: 48px;
    border: none;
    background: transparent;
    color: rgba($white, 0.75);
    font-family: $font-secondary;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  @media (min-width: 720px) {
    &__barra { justify-content: flex-end; }
    &__btn, &__cancelar { flex: 0 0 auto; }
    &__btn.is-pri { flex-basis: auto; order: 0; }
  }
}
</style>
