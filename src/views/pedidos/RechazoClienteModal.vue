<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { usePedidosStore } from '@/stores/pedidos'
import { formatMoney } from '@/utils/format'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * El cliente no recibió un pedido aprobado (no lo pidió, no estaba...): queda
 * "Rechazado por el cliente" y deja de salir como pendiente de entregar.
 * Motivo obligatorio y doble toque para confirmar.
 */
const props = defineProps<{ pedido: Pedido | null }>()
const emit = defineEmits<{ close: [] }>()

const store = usePedidosStore()

const SUGERENCIAS = ['El cliente dice que no pidió ese producto', 'El cliente no estaba en el local', 'El cliente ya no lo quiere']

const texto = ref('')
const guardando = ref(false)
const error = ref('')
const confirmando = ref(false)

watch(
  () => props.pedido,
  (p) => {
    if (!p) return
    texto.value = ''
    error.value = ''
    confirmando.value = false
  },
)

const motivo = computed(() => texto.value.trim())
const puedeGuardar = computed(() => !guardando.value && motivo.value.length >= 3)
const yaSalio = computed(() => !!(props.pedido?.despacho?.salidaAt || props.pedido?.entregas?.length))

function usarSugerencia(s: string) {
  texto.value = motivo.value === s ? '' : s
}

async function confirmar() {
  if (!props.pedido || !puedeGuardar.value) return
  if (!confirmando.value) {
    confirmando.value = true
    return
  }
  guardando.value = true
  error.value = ''
  try {
    await store.rechazoCliente(props.pedido._id, motivo.value)
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo registrar. Vuelve a intentar.'
    confirmando.value = false
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="pedido" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rechazo-cliente-titulo">
          <header class="modal__head">
            <div>
              <h2 id="rechazo-cliente-titulo">El cliente no recibió {{ pedido.numero }}</h2>
              <p class="modal__hint">{{ pedido.clienteNombre }} · {{ formatMoney(pedido.total) }} · {{ pedido.vendedorNombre }}</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <p class="ayuda">
            El pedido queda <b>Rechazado por el cliente</b>: ya no sale como pendiente de entregar, le devuelve el cupo al asesor y no suma en
            sus ventas.<template v-if="yaSalio"> La mercadería ya había salido: regresa a bodega.</template>
            Se avisa a administración y al asesor.
            <template v-if="pedido.facturacion || yaSalio"><br /><b>Ya estaba facturado:</b> registren la devolución (nota de crédito) en el ERP; ahí el stock vuelve solo al inventario de la app.</template>
            <template v-else> Como aún no se facturó, su stock vuelve a quedar disponible al instante.</template>
          </p>

          <div class="field">
            <div class="sugs">
              <button
                v-for="s in SUGERENCIAS"
                :key="s"
                type="button"
                class="sug"
                :class="{ 'is-on': motivo === s }"
                :aria-pressed="motivo === s"
                @click="usarSugerencia(s)"
              >{{ s }}</button>
            </div>
            <textarea v-model="texto" rows="3" class="obs" maxlength="500" placeholder="¿Por qué no lo recibió? (obligatorio)"></textarea>
            <small v-if="motivo.length < 3" class="falta">Escribe el motivo.</small>
          </div>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="confirmando ? (confirmando = false) : emit('close')">
                {{ confirmando ? 'No, volver' : 'Cancelar' }}
              </button>
              <button type="button" class="modal__save is-peligro" :disabled="!puedeGuardar" @click="confirmar">
                <BaseSpinner v-if="guardando" :size="14" light />
                {{ confirmando ? 'Sí, el cliente no lo recibió' : 'Registrar rechazo del cliente' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../equipo/form-modal';

.ayuda { font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); margin-bottom: 10px; b { color: var(--text); } }
.sugs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.sug {
  min-height: 40px; padding: 8px 12px; border: 1.5px solid var(--border-strong); border-radius: 999px; background: var(--surface);
  font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; color: var(--text); cursor: pointer; text-align: left;
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: var(--accent-soft); color: $primary; }
}
.obs {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
  font-family: $font-secondary; font-size: 0.88rem; color: var(--text); background: var(--surface); resize: vertical;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
.falta { display: block; margin-top: 4px; font-family: $font-secondary; font-size: 0.7rem; color: darken($alert-warning, 22%); }
.modal__save.is-peligro:not(:disabled) { background: $alert-error; }
</style>
