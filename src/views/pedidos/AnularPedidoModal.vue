<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { usePedidosStore } from '@/stores/pedidos'
import { useUserStore } from '@/stores/user'
import { formatMoney } from '@/utils/format'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/** Anular un pedido que aún no sale: el cliente ya no lo quiere, se pasó del cupo... Motivo obligatorio. */
const props = defineProps<{ pedido: Pedido | null }>()
const emit = defineEmits<{ close: [] }>()

const store = usePedidosStore()
const userStore = useUserStore()

const SUGERENCIAS = ['El cliente ya no desea el pedido', 'Se pasó del cupo asignado', 'Pedido duplicado']

const texto = ref('')
const guardando = ref(false)
const error = ref('')
/** Anular pide un segundo toque antes de enviar. */
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
const aviso = computed(() =>
  userStore.isAdmin ? 'Se le avisa al asesor por correo y en la app.' : 'Se le avisa a administración por correo y en la app.',
)

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
    await store.anular(props.pedido._id, motivo.value)
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo anular el pedido. Vuelve a intentar.'
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
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="anular-titulo">
          <header class="modal__head">
            <div>
              <h2 id="anular-titulo">Anular pedido {{ pedido.numero }}</h2>
              <p class="modal__hint">{{ pedido.clienteNombre }} · {{ formatMoney(pedido.total) }} · {{ pedido.vendedorNombre }}</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <p class="ayuda">
            El pedido no se despacha y su stock (y cupo) vuelve a quedar disponible. {{ aviso }}
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
            <textarea v-model="texto" rows="3" class="obs" maxlength="500" placeholder="Motivo de la anulación (obligatorio)"></textarea>
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
                {{ confirmando ? 'Sí, anular pedido' : 'Anular pedido' }}
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

.ayuda { font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); margin-bottom: 10px; }
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
