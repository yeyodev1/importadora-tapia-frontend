<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import FotoOrdenPedido from '../pedidos/FotoOrdenPedido.vue'
import { usePedidosStore } from '@/stores/pedidos'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/** Bodega marca la salida del pedido: la hora la pone el sistema; fotos y nota opcionales. */
const props = defineProps<{ pedido: Pedido | null }>()
const emit = defineEmits<{ close: [] }>()

const store = usePedidosStore()
const fotos = ref<string[]>([])
const observacion = ref('')
const subiendo = ref(false)
const guardando = ref(false)
const error = ref('')

const yaSalio = computed(() => !!props.pedido?.despacho?.salidaAt)
const horaSalida = computed(() =>
  props.pedido?.despacho?.salidaAt
    ? new Date(props.pedido.despacho.salidaAt).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '',
)

watch(
  () => props.pedido,
  (p) => {
    if (!p) return
    fotos.value = [...(p.despacho?.fotos || [])]
    observacion.value = p.despacho?.observacion || ''
    error.value = ''
  },
)

async function confirmar() {
  if (!props.pedido || guardando.value || subiendo.value) return
  guardando.value = true
  error.value = ''
  try {
    await store.marcarDespacho(props.pedido._id, { fotos: fotos.value, observacion: observacion.value.trim() || undefined })
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo marcar la salida. Vuelve a intentar.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="pedido" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="salida-bodega-titulo">
          <header class="modal__head">
            <div>
              <h2 id="salida-bodega-titulo">
                <i class="fa-solid fa-truck-ramp-box" aria-hidden="true"></i>
                {{ yaSalio ? 'Fotos del despacho' : 'Marcar salida' }}
              </h2>
              <p class="modal__hint">
                {{ pedido.numero }} · {{ pedido.clienteNombre }} · {{ pedido.items.length }} producto{{ pedido.items.length === 1 ? '' : 's' }}
              </p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <p class="hora">
            <i class="fa-solid fa-clock" aria-hidden="true"></i>
            <span v-if="yaSalio">Salió el <b>{{ horaSalida }}</b>. Esa hora no cambia.</span>
            <span v-else>La hora de salida la marca el sistema al confirmar y no se puede editar.</span>
          </p>

          <div class="field">
            <span>Fotos del despacho <em class="opt">· opcional</em></span>
            <FotoOrdenPedido
              v-model="fotos"
              texto-foto="Tomar foto del despacho"
              titulo-recorte="Recorta la foto del despacho"
              nombre="del despacho"
              @ocupado="(v) => (subiendo = v)"
            />
          </div>

          <label class="field">
            <span>Observación (opcional)</span>
            <textarea id="despacho-observacion" v-model="observacion" rows="2" class="obs" placeholder="Ej.: salió en el camión de la mañana"></textarea>
          </label>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
              <button type="button" class="modal__save" :disabled="guardando || subiendo" @click="confirmar">
                <BaseSpinner v-if="guardando" :size="14" light />
                {{ yaSalio ? 'Guardar fotos' : 'Confirmar salida' }}
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

.hora {
  display: flex; align-items: flex-start; gap: 8px; margin: 4px 0 14px; padding: 10px 12px; border-radius: 9px;
  background: var(--accent-soft); font-family: $font-secondary; font-size: 0.8rem; color: var(--text);
  i { margin-top: 2px; color: $primary; }
}
.obs {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
  font-family: $font-secondary; font-size: 0.88rem; color: var(--text); background: var(--surface); resize: vertical;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
</style>
