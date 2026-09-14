<script setup lang="ts">
import { ref } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import RecortarImagen from '@/components/ui/RecortarImagen.vue'
import { useRecorte } from '@/composables/useRecorte'
import { subirArchivo } from '@/utils/subirDocumento'
import { pedidosService } from '@/services/pedidos.service'

/**
 * Fotos de la orden de pedido (OP) en papel: se toman (varias, si hay hojas o
 * anotaciones), se recortan y suben al instante. Se enlazan al enviar el pedido.
 */
const model = defineModel<string[]>({ default: () => [] })
const emit = defineEmits<{ ocupado: [v: boolean] }>()

const MAX = 10
const progreso = ref('')
const error = ref('')
/** Doble confirmación al quitar una foto. */
const quitando = ref<{ url: string; paso: 1 | 2 } | null>(null)
const recorte = useRecorte()

const esPdf = (url: string) => url.includes('/raw/')
const miniatura = (url: string) => url.replace('/image/upload/', '/image/upload/c_fill,w_200,h_200/')

async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length) return
  error.value = ''
  quitando.value = null
  emit('ocupado', true)
  try {
    for (const [i, original] of files.entries()) {
      if (model.value.length >= MAX) {
        error.value = `Máximo ${MAX} fotos por orden de pedido.`
        break
      }
      const file = await recorte.prepararArchivo(original)
      if (!file) continue
      progreso.value = files.length > 1 ? `Subiendo ${i + 1} de ${files.length}…` : 'Subiendo foto de la OP…'
      const archivo = await subirArchivo(file, () => pedidosService.firmaSubida())
      model.value = [...model.value, archivo.url]
    }
  } catch (err) {
    error.value = (err as { message?: string })?.message || 'No se pudo subir la foto de la OP'
  } finally {
    progreso.value = ''
    emit('ocupado', false)
  }
}

function confirmarQuitar(url: string) {
  if (quitando.value?.url !== url) {
    quitando.value = { url, paso: 1 }
  } else if (quitando.value.paso === 1) {
    quitando.value = { url, paso: 2 }
  } else {
    model.value = model.value.filter((u) => u !== url)
    quitando.value = null
  }
}
</script>

<template>
  <div class="op">
    <div v-if="model.length" class="op__fotos">
      <div v-for="(url, i) in model" :key="url" class="op__foto" :class="{ 'is-quitando': quitando?.url === url }">
        <a :href="url" target="_blank" rel="noopener" class="op__ver" :aria-label="`Ver foto ${i + 1} de la OP`">
          <span v-if="esPdf(url)" class="op__pdf"><i class="fa-solid fa-file-pdf"></i></span>
          <img v-else :src="miniatura(url)" :alt="`Foto ${i + 1} de la orden de pedido`" />
          <b class="op__n">{{ i + 1 }}</b>
        </a>
        <button type="button" class="op__x" :aria-label="`Quitar foto ${i + 1}`" @click="confirmarQuitar(url)">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>

    <div v-if="quitando" class="op__confirma" role="alert">
      <span>{{ quitando.paso === 1 ? `¿Quitar la foto ${model.indexOf(quitando.url) + 1}?` : 'Se quitará de la orden de pedido. ¿Confirmas?' }}</span>
      <button type="button" class="op__no" @click="quitando = null">Cancelar</button>
      <button type="button" class="op__si" @click="confirmarQuitar(quitando.url)">
        {{ quitando.paso === 1 ? 'Quitar' : 'Sí, quitar' }}
      </button>
    </div>

    <p v-if="model.length" class="op__info">
      ✅ {{ model.length }} foto{{ model.length === 1 ? '' : 's' }} de la OP · se enlazan al enviar el pedido. Toca una para verla.
    </p>

    <label v-if="model.length < MAX" class="op__add" :class="{ 'is-busy': progreso, 'is-otra': model.length }">
      <input type="file" accept="image/*,application/pdf" multiple :disabled="!!progreso" @change="onFiles" />
      <BaseSpinner v-if="progreso" :size="16" />
      <span v-else class="op__emoji" aria-hidden="true">{{ model.length ? '➕' : '📸' }}</span>
      <span>{{ progreso || (model.length ? 'Tomar otra foto' : 'Tomar foto de la orden de pedido (OP)') }}</span>
    </label>

    <p v-if="error" class="op__err" role="alert">{{ error }}</p>

    <RecortarImagen :file="recorte.archivo.value" titulo="Recorta la orden de pedido" @listo="recorte.listo" @cancelar="recorte.cancelar" />
  </div>
</template>

<style lang="scss" scoped>
.op {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__fotos { display: flex; flex-wrap: wrap; gap: 10px; }

  &__foto {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    &.is-quitando .op__ver { border-color: $alert-error; }
  }

  &__ver {
    position: relative;
    display: block;
    width: 84px;
    height: 84px;
    border: 1.5px solid rgba($secondary, 0.6);
    border-radius: 10px;
    overflow: hidden;
    background: rgba($primary-dark, 0.05);
    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__pdf { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: $alert-error-bg; color: $alert-error; font-size: 1.6rem; }

  &__n {
    position: absolute; top: 4px; left: 4px; min-width: 20px; height: 20px; padding: 0 5px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 999px; background: rgba($primary-dark, 0.75); color: $white; font-size: 0.66rem; font-weight: 800;
  }

  &__x {
    width: 44px; height: 36px; border: none; border-radius: 8px; background: transparent; color: var(--text-faint); cursor: pointer;
    &:hover { color: $alert-error; background: $alert-error-bg; }
  }

  &__confirma {
    display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 10px; border-radius: 9px; background: $alert-error-bg;
    span { flex: 1 1 150px; font-family: $font-secondary; font-size: 0.76rem; font-weight: 600; color: darken($alert-error, 10%); }
    button { min-height: 36px; padding: 0 12px; border-radius: 8px; font-family: $font-secondary; font-size: 0.74rem; font-weight: 700; cursor: pointer; }
  }
  &__no { border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
  &__si { border: none; background: $alert-error; color: $white; }

  &__info { font-family: $font-secondary; font-size: 0.72rem; color: darken($secondary, 15%); }

  &__add {
    position: relative; display: flex; align-items: center; justify-content: center; gap: 9px;
    min-height: 56px; padding: 12px; border: 1.5px dashed $primary; border-radius: 11px;
    background: var(--accent-soft); color: $primary; font-family: $font-secondary; font-size: 0.86rem; font-weight: 700; cursor: pointer;
    input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    &.is-otra { min-height: 46px; background: var(--surface); }
    &.is-busy { cursor: wait; color: var(--text-soft); }
  }

  &__emoji { font-size: 1.15rem; }
  &__err { font-family: $font-secondary; font-size: 0.74rem; color: darken($alert-error, 8%); }
}
</style>
