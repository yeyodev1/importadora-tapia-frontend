<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import RecortarImagen from '@/components/ui/RecortarImagen.vue'
import { useRecorte } from '@/composables/useRecorte'
import { subirDocumento } from '@/utils/subirDocumento'
import type { DefDocumento } from './documentos'
import type { DocumentoSolicitud } from '@/types/solicitudes'

const props = defineProps<{
  def: DefDocumento
  archivos: DocumentoSolicitud[]
  /** Archivos exigidos para enviar (0 = no aplica a este tipo de persona). */
  minimo: number
  disabled: boolean
}>()

const emit = defineEmits<{
  agregar: [doc: DocumentoSolicitud]
  quitar: [doc: DocumentoSolicitud]
  ocupado: [v: boolean]
}>()

const progreso = ref('')
const error = ref('')
const recorte = useRecorte()

const estado = computed((): { tone: 'neutral' | 'success' | 'warning'; label: string } => {
  const n = props.archivos.length
  if (props.minimo === 0) return { tone: 'neutral', label: n ? `${n} adjunto${n > 1 ? 's' : ''}` : 'No aplica' }
  if (n >= props.minimo) return { tone: 'success', label: 'Completo' }
  return { tone: 'warning', label: props.minimo > 1 ? `${n} de ${props.minimo}` : 'Falta' }
})

async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length) return
  error.value = ''
  emit('ocupado', true)
  try {
    for (const [i, original] of files.entries()) {
      // Foto: primero se recorta (o se usa completa); cancelar la salta.
      const file = await recorte.prepararArchivo(original)
      if (!file) continue
      progreso.value = files.length > 1 ? `Subiendo ${i + 1} de ${files.length}…` : 'Subiendo…'
      emit('agregar', await subirDocumento(file, props.def.tipo))
    }
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    progreso.value = ''
    emit('ocupado', false)
  }
}

/** Miniatura liviana generada por Cloudinary para no descargar la foto completa. */
function miniatura(d: DocumentoSolicitud) {
  return d.url.replace('/image/upload/', '/image/upload/c_fill,w_120,h_120/')
}

function peso(bytes: number) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
</script>

<template>
  <div class="doc" :class="{ 'is-ok': estado.tone === 'success' }">
    <div class="doc__head">
      <div class="doc__txt">
        <strong>{{ def.label }}</strong>
        <small>{{ def.ayuda }}</small>
      </div>
      <BaseBadge :tone="estado.tone">{{ estado.label }}</BaseBadge>
    </div>

    <ul v-if="archivos.length" class="doc__files">
      <li v-for="a in archivos" :key="a.url">
        <a :href="a.url" target="_blank" rel="noopener" class="doc__file">
          <img v-if="a.formato === 'imagen'" :src="miniatura(a)" alt="" loading="lazy" />
          <span v-else class="doc__pdf"><i class="fa-solid fa-file-pdf"></i></span>
          <span class="doc__name">
            {{ a.nombre || 'Archivo' }}
            <small>{{ a.formato === 'pdf' ? 'PDF' : 'Foto' }} · {{ peso(a.bytes) }} · toca para abrir</small>
          </span>
        </a>
        <button v-if="!disabled" type="button" class="doc__x" :aria-label="`Quitar ${a.nombre}`" @click="emit('quitar', a)">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </li>
    </ul>

    <label v-if="!disabled" class="doc__add" :class="{ 'is-busy': progreso }">
      <input type="file" accept="image/*,application/pdf" multiple :disabled="!!progreso" @change="onFiles" />
      <BaseSpinner v-if="progreso" :size="14" />
      <i v-else class="fa-solid fa-paperclip"></i>
      {{ progreso || (archivos.length ? 'Agregar otro archivo' : 'Tomar foto o subir PDF') }}
    </label>

    <p v-if="error" class="doc__err" role="alert">{{ error }}</p>

    <RecortarImagen :file="recorte.archivo.value" :titulo="def.label" @listo="recorte.listo" @cancelar="recorte.cancelar" />
  </div>
</template>

<style lang="scss" scoped>
.doc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 11px;
  transition: border-color 0.2s ease;

  &.is-ok { border-color: rgba($secondary, 0.5); }

  &__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  &__txt {
    display: flex; flex-direction: column; gap: 2px; min-width: 0;
    strong { font-size: 0.84rem; font-weight: 700; }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-soft); }
  }

  &__files { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  &__files li { display: flex; align-items: center; gap: 8px; }

  &__file {
    flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px;
    padding: 6px; border-radius: 9px; background: rgba($primary-dark, 0.03); text-decoration: none; color: var(--text);
    img { width: 44px; height: 44px; border-radius: 7px; object-fit: cover; flex-shrink: 0; }
    &:hover { background: var(--accent-soft); }
  }

  &__pdf {
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 44px; height: 44px; border-radius: 7px; background: $alert-error-bg; color: $alert-error; font-size: 1.2rem;
  }

  &__name {
    display: flex; flex-direction: column; min-width: 0;
    font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; overflow-wrap: anywhere;
    small { font-size: 0.68rem; font-weight: 500; color: var(--text-faint); }
  }

  &__x {
    flex-shrink: 0; width: 40px; height: 40px; border: none; border-radius: 8px;
    background: transparent; color: var(--text-faint); cursor: pointer;
    &:hover { color: $alert-error; background: $alert-error-bg; }
  }

  &__add {
    position: relative; display: flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 46px; padding: 10px; border: 1.5px dashed var(--border-strong); border-radius: 10px;
    font-family: $font-secondary; font-size: 0.8rem; font-weight: 700; color: $primary; cursor: pointer;
    input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    &:hover { border-color: $primary; background: var(--accent-soft); }
    &.is-busy { color: var(--text-soft); cursor: wait; }
  }

  &__err { font-family: $font-secondary; font-size: 0.74rem; color: darken($alert-error, 8%); }
}
</style>
