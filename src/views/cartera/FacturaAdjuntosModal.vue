<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import RecortarImagen from '@/components/ui/RecortarImagen.vue'
import { useRecorte } from '@/composables/useRecorte'
import { useFacturaAdjuntosStore } from '@/stores/facturaAdjuntos'
import { useUserStore } from '@/stores/user'
import { numeroFactura } from '@/utils/compartirFactura'
import { formatDate, formatMoney } from '@/utils/format'
import type { FacturaAdjunto, FacturaCartera } from '@/types/erp'

/** Fotos o PDF de la factura física: el ERP no trae el detalle de productos. */
const props = defineProps<{ open: boolean; factura: FacturaCartera | null }>()
const emit = defineEmits<{ close: [] }>()

const store = useFacturaAdjuntosStore()
const userStore = useUserStore()

const progreso = ref('')
const error = ref('')
/** Doble confirmación al quitar: id del archivo y en qué paso va. */
const quitando = ref<{ id: string; paso: 1 | 2 } | null>(null)
const borrando = ref(false)
const recorte = useRecorte()

watch(
  () => props.open,
  (o) => {
    if (!o) return
    store.fetch()
    error.value = ''
    quitando.value = null
  },
)

const archivos = computed(() => (props.factura ? store.porFactura.get(String(props.factura.trc_codigo)) || [] : []))
const puedeQuitar = (a: FacturaAdjunto) => userStore.isAdmin || a.subidoPorId === userStore.id

async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length || !props.factura) return
  error.value = ''
  try {
    for (const [i, original] of files.entries()) {
      // Foto: primero se recorta (o se usa completa); cancelar la salta.
      const file = await recorte.prepararArchivo(original)
      if (!file) continue
      progreso.value = files.length > 1 ? `Subiendo ${i + 1} de ${files.length}…` : 'Subiendo…'
      await store.subir(String(props.factura.trc_codigo), file)
    }
  } catch (err) {
    error.value = (err as { message?: string })?.message || 'No se pudo subir el archivo'
  } finally {
    progreso.value = ''
  }
}

async function confirmarQuitar(a: FacturaAdjunto) {
  if (quitando.value?.id !== a._id || quitando.value.paso === 1) {
    quitando.value = { id: a._id, paso: quitando.value?.id === a._id ? 2 : 1 }
    return
  }
  borrando.value = true
  error.value = ''
  try {
    await store.quitar(a._id)
    quitando.value = null
  } catch (err) {
    error.value = (err as { message?: string })?.message || 'No se pudo quitar el archivo'
  } finally {
    borrando.value = false
  }
}

const miniatura = (a: FacturaAdjunto) => a.url.replace('/image/upload/', '/image/upload/c_fill,w_160,h_160/')
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open && factura" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="adjuntos-titulo">
          <header class="modal__head">
            <div>
              <h2 id="adjuntos-titulo">Factura {{ numeroFactura(factura) }}</h2>
              <p class="modal__hint">
                {{ factura.per_nombre }} · saldo {{ formatMoney(factura.saldo_pendiente) }}.
                Sube la foto o el PDF de la factura para ver qué se le vendió.
              </p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <label class="subir" :class="{ 'is-busy': progreso }">
            <input type="file" accept="image/*,application/pdf" multiple :disabled="!!progreso" @change="onFiles" />
            <BaseSpinner v-if="progreso" :size="16" />
            <i v-else class="fa-solid fa-camera"></i>
            {{ progreso || 'Tomar foto o subir PDF de la factura' }}
          </label>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <p v-if="store.loading && !store.fetchedAt" class="vacio"><BaseSpinner :size="12" /> Cargando archivos…</p>
          <p v-else-if="!archivos.length" class="vacio">Esta factura todavía no tiene foto ni PDF.</p>

          <ul v-else class="lista">
            <li v-for="a in archivos" :key="a._id" class="item">
              <a :href="a.url" target="_blank" rel="noopener" class="item__abrir">
                <img v-if="a.formato === 'imagen'" :src="miniatura(a)" alt="" loading="lazy" />
                <span v-else class="item__pdf"><i class="fa-solid fa-file-pdf"></i></span>
                <span class="item__txt">
                  <strong>{{ a.nombre || 'Archivo' }}</strong>
                  <small>{{ a.subidoPor }} · {{ formatDate(a.createdAt) }} · toca para abrir</small>
                </span>
              </a>
              <template v-if="puedeQuitar(a)">
                <div v-if="quitando?.id === a._id" class="confirma">
                  <span>{{ quitando.paso === 1 ? '¿Quitar este archivo?' : 'Se quitará para todos. ¿Confirmas?' }}</span>
                  <button type="button" class="confirma__no" @click="quitando = null">Cancelar</button>
                  <button type="button" class="confirma__si" :disabled="borrando" @click="confirmarQuitar(a)">
                    {{ quitando.paso === 1 ? 'Quitar' : 'Sí, quitar definitivamente' }}
                  </button>
                </div>
                <button v-else type="button" class="item__x" :aria-label="`Quitar ${a.nombre}`" @click="confirmarQuitar(a)">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </template>
            </li>
          </ul>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__save" @click="emit('close')">Listo</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <RecortarImagen :file="recorte.archivo.value" titulo="Recorta la factura" @listo="recorte.listo" @cancelar="recorte.cancelar" />
</template>

<style lang="scss" scoped>
@use '../equipo/form-modal';

.subir {
  position: relative; display: flex; align-items: center; justify-content: center; gap: 9px;
  min-height: 56px; margin-bottom: 12px; padding: 12px; border: 1.5px dashed $primary; border-radius: 11px;
  background: var(--accent-soft); color: $primary; font-family: $font-secondary; font-size: 0.86rem; font-weight: 700; cursor: pointer;
  input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  &.is-busy { cursor: wait; color: var(--text-soft); }
}
.vacio { display: flex; align-items: center; gap: 8px; margin: 6px 0 12px; font-family: $font-secondary; font-size: 0.8rem; color: var(--text-soft); }
.lista { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; max-height: 50vh; overflow-y: auto; }
.item {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  &__abrir {
    flex: 1 1 220px; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 6px;
    border: 1px solid var(--border); border-radius: 10px; color: var(--text); text-decoration: none;
    img { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: rgba($primary-dark, 0.05); }
    &:hover { border-color: $primary; }
  }
  &__pdf { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 56px; height: 56px; border-radius: 8px; background: $alert-error-bg; color: $alert-error; font-size: 1.4rem; }
  &__txt {
    display: flex; flex-direction: column; min-width: 0;
    strong { font-size: 0.82rem; font-weight: 700; overflow-wrap: anywhere; }
    small { font-family: $font-secondary; font-size: 0.68rem; color: var(--text-faint); }
  }
  &__x {
    width: 44px; height: 44px; flex-shrink: 0; border: none; border-radius: 9px; background: transparent; color: var(--text-faint); cursor: pointer;
    &:hover { color: $alert-error; background: $alert-error-bg; }
  }
}
.confirma {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1 1 100%; padding: 8px 10px; border-radius: 9px; background: $alert-error-bg;
  span { flex: 1 1 140px; font-family: $font-secondary; font-size: 0.76rem; font-weight: 600; color: darken($alert-error, 10%); }
  button { min-height: 36px; padding: 0 12px; border-radius: 8px; font-family: $font-secondary; font-size: 0.74rem; font-weight: 700; cursor: pointer; }
  &__no { border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
  &__si { border: none; background: $alert-error; color: $white; &:disabled { opacity: 0.6; } }
}
</style>
