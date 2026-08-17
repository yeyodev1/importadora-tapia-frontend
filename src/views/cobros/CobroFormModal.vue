<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCobrosStore } from '@/stores/cobros'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import SignaturePad from '@/components/ui/SignaturePad.vue'
import { fileToCompressedDataUri } from '@/utils/image'
import type { MetodoPago } from '@/types/erp'
import type { ApiError } from '@/types'

const props = defineProps<{
  open: boolean
  clienteNombre?: string
  clienteCodigo?: string
  facturaRef?: string
}>()

const emit = defineEmits<{ close: []; saved: [] }>()
const cobros = useCobrosStore()

const cliente = ref('')
const monto = ref<number | null>(null)
const metodo = ref<MetodoPago>('efectivo')
const observacion = ref('')
const comprobante = ref('')
const firma = ref('')
const fileName = ref('')
const preparing = ref(false)
const saving = ref(false)
const error = ref('')

const metodos: { v: MetodoPago; label: string }[] = [
  { v: 'efectivo', label: 'Efectivo' },
  { v: 'transferencia', label: 'Transferencia' },
  { v: 'cheque', label: 'Cheque' },
  { v: 'deposito', label: 'Depósito' },
]

/** El comprobante (foto) es obligatorio salvo en efectivo. */
const requiereFoto = () => metodo.value !== 'efectivo'

watch(
  () => props.open,
  (o) => {
    if (!o) return
    error.value = ''
    cliente.value = props.clienteNombre || ''
    monto.value = null
    metodo.value = 'efectivo'
    observacion.value = ''
    comprobante.value = ''
    firma.value = ''
    fileName.value = ''
  },
)

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  preparing.value = true
  error.value = ''
  try {
    comprobante.value = await fileToCompressedDataUri(file)
    fileName.value = file.name
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    preparing.value = false
  }
}

async function guardar() {
  if (saving.value) return
  error.value = ''
  if (!cliente.value || !monto.value || monto.value <= 0) {
    error.value = 'Indica el cliente y un monto válido.'
    return
  }
  if (requiereFoto() && !comprobante.value) {
    error.value = 'Adjunta la foto del comprobante para este método de pago.'
    return
  }
  saving.value = true
  try {
    await cobros.create({
      clienteNombre: cliente.value,
      clienteCodigo: props.clienteCodigo,
      facturaRef: props.facturaRef,
      monto: Number(monto.value),
      metodoPago: metodo.value,
      comprobante: comprobante.value || tinyPlaceholder(),
      firma: firma.value || undefined,
      observacion: observacion.value || undefined,
    })
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo registrar el cobro'
  } finally {
    saving.value = false
  }
}

/** Efectivo sin foto: se envía un marcador mínimo (el backend exige comprobante). */
function tinyPlaceholder() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="backdrop" @click.self="emit('close')">
        <div class="sheet" role="dialog" aria-modal="true">
          <header class="sheet__head">
            <h2>Registrar cobro</h2>
            <button class="sheet__x" type="button" aria-label="Cerrar" @click="emit('close')">✕</button>
          </header>
          <p class="sheet__note">
            Este registro no emite factura ni modifica el ERP. Queda como respaldo para que
            administración lo aplique en su sistema.
          </p>

          <form @submit.prevent="guardar">
            <label class="fld">
              <span>Cliente</span>
              <input v-model="cliente" type="text" placeholder="Nombre del cliente" required />
            </label>

            <div class="grid2">
              <label class="fld">
                <span>Monto (USD)</span>
                <input v-model.number="monto" type="number" step="0.01" min="0" placeholder="0.00" required />
              </label>
              <label class="fld">
                <span>Factura (opcional)</span>
                <input :value="facturaRef" type="text" placeholder="Serie-número" readonly />
              </label>
            </div>

            <div class="fld">
              <span>Método de pago</span>
              <div class="metodos">
                <button
                  v-for="m in metodos"
                  :key="m.v"
                  type="button"
                  class="metodo"
                  :class="{ 'is-active': metodo === m.v }"
                  @click="metodo = m.v"
                >
                  {{ m.label }}
                </button>
              </div>
            </div>

            <div class="fld">
              <span>
                Foto del comprobante
                <em v-if="requiereFoto()">· obligatoria</em>
                <em v-else class="opt">· opcional en efectivo</em>
              </span>
              <label class="upload" :class="{ 'has-file': comprobante }">
                <input type="file" accept="image/*" capture="environment" @change="onFile" />
                <BaseSpinner v-if="preparing" :size="18" />
                <template v-else-if="comprobante">
                  <img :src="comprobante" alt="Comprobante" />
                  <span>{{ fileName || 'Foto lista' }} · toca para cambiar</span>
                </template>
                <template v-else>
                  <i class="fa-solid fa-camera"></i>
                  <span>Tomar foto o elegir imagen</span>
                </template>
              </label>
            </div>

            <div class="fld">
              <span>Firma del cliente <em class="opt">· opcional</em></span>
              <SignaturePad @change="(v) => (firma = v || '')" />
            </div>

            <label class="fld">
              <span>Observación (opcional)</span>
              <textarea v-model="observacion" rows="2" placeholder="Ej. cheque posfechado al 30 de mayo"></textarea>
            </label>

            <p v-if="error" class="err" role="alert">{{ error }}</p>

            <div class="actions">
              <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="saving || preparing">
                <BaseSpinner v-if="saving" :size="14" light />
                Registrar cobro
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.backdrop {
  position: fixed; inset: 0; z-index: 100; display: grid; place-items: end center;
  background: rgba($primary-dark, 0.5); backdrop-filter: blur(3px);
  @media (min-width: 641px) { place-items: center; padding: 16px; }
}
.sheet {
  width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto;
  background: var(--surface); box-shadow: var(--shadow-pop);
  border-radius: 18px 18px 0 0; padding: 22px 20px 26px;
  @media (min-width: 641px) { border-radius: 16px; }

  &__head { display: flex; align-items: center; justify-content: space-between; }
  &__head h2 { font-size: 1.1rem; font-weight: 800; }
  &__x { border: none; background: transparent; font-size: 1rem; color: var(--text-faint); cursor: pointer; padding: 4px 8px; }
  &__note {
    margin: 8px 0 18px; font-family: $font-secondary; font-size: 0.76rem;
    color: var(--text-soft); background: rgba($primary, 0.06);
    border: 1px solid rgba($primary, 0.14); border-radius: 9px; padding: 10px 12px;
  }
}
form { display: flex; flex-direction: column; gap: 14px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.fld { display: flex; flex-direction: column; gap: 6px;
  span { font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; color: var(--text-soft);
    em { font-style: normal; color: $alert-error; font-weight: 700; &.opt { color: var(--text-faint); } } }
  input, textarea {
    padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
    font-family: $font-secondary; font-size: 0.9rem; color: var(--text); background: var(--surface);
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
    &[readonly] { background: rgba($primary-dark, 0.04); color: var(--text-faint); }
  }
}
.metodos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.metodo {
  padding: 11px 8px; border: 1px solid var(--border-strong); border-radius: 9px;
  background: var(--surface); font-family: $font-principal; font-size: 0.82rem; font-weight: 600;
  color: var(--text-soft); cursor: pointer; transition: all 0.18s ease;
  &:hover { border-color: $primary; color: $primary; }
  &.is-active { background: $primary; border-color: $primary; color: $white; box-shadow: 0 4px 12px rgba($primary, 0.3); }
}
.upload {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; min-height: 100px; padding: 14px; border: 1.5px dashed var(--border-strong);
  border-radius: 11px; cursor: pointer; color: var(--text-faint); transition: border-color 0.2s ease;
  input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  i { font-size: 1.5rem; }
  span { font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; text-align: center; }
  img { max-height: 120px; border-radius: 8px; }
  &:hover { border-color: $primary; }
  &.has-file { border-style: solid; border-color: $secondary; color: darken($secondary, 12%); }
}
.err {
  font-family: $font-secondary; font-size: 0.78rem; color: darken($alert-error, 8%);
  background: $alert-error-bg; border-radius: 8px; padding: 9px 12px; margin: 0;
}
.actions { display: flex; gap: 10px; margin-top: 4px;
  button { flex: 1; padding: 12px; border-radius: 10px; font-family: $font-principal; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
}
.btn-ghost { border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
.btn-primary { border: none; background: $primary; color: $white; transition: background 0.2s ease;
  &:hover:not(:disabled) { background: darken($primary, 6%); } &:disabled { opacity: 0.8; } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; .sheet { transition: transform 0.25s var(--ease-out); } }
.modal-enter-from, .modal-leave-to { opacity: 0; .sheet { transform: translateY(30px); } }
</style>
