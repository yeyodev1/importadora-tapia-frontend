<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import FotoOrdenPedido from '../pedidos/FotoOrdenPedido.vue'
import { usePedidosStore } from '@/stores/pedidos'
import { formatQty } from '@/utils/format'
import { avanceEntregas } from './entregas'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Bodega marca la salida del pedido: la hora la pone el sistema; fotos y nota opcionales.
 * Si el cliente recibe por partes, bodega pone cuánto sale ahora de cada producto;
 * cuando sale lo último, el pedido queda despachado.
 */
const props = defineProps<{ pedido: Pedido | null }>()
const emit = defineEmits<{ close: [] }>()

const store = usePedidosStore()
const fotos = ref<string[]>([])
const observacion = ref('')
const subiendo = ref(false)
const guardando = ref(false)
const error = ref('')
/** Cuánto sale en esta salida, por línea (por defecto todo lo que falta). */
const salen = ref<number[]>([])

const avance = computed(() => (props.pedido ? avanceEntregas(props.pedido) : []))
const yaHuboEntregas = computed(() => !!props.pedido?.entregas?.length)
const lineasValidas = computed(() =>
  avance.value.every((a, i) => {
    const n = Number(salen.value[i])
    return Number.isFinite(n) && n >= 0 && n <= a.falta
  }),
)
const algoSale = computed(() => salen.value.some((n) => Number(n) > 0))
const completa = computed(() => avance.value.every((a, i) => Number(salen.value[i]) === a.falta))

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
    salen.value = avanceEntregas(p).map((a) => a.falta)
  },
)

async function confirmar() {
  if (!props.pedido || guardando.value || subiendo.value) return
  if (!yaSalio.value && (!lineasValidas.value || !algoSale.value)) return
  guardando.value = true
  error.value = ''
  try {
    await store.marcarDespacho(props.pedido._id, {
      fotos: fotos.value,
      observacion: observacion.value.trim() || undefined,
      ...(yaSalio.value ? {} : { cantidades: salen.value.map(Number) }),
    })
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

          <div v-if="!yaSalio" class="field">
            <span>¿Cuánto sale ahora? <em class="opt">· si el cliente recibe por partes, baja la cantidad</em></span>
            <ul class="lineas">
              <li v-for="(a, i) in avance" :key="i" class="linea" :class="{ 'is-error': !(Number(salen[i]) >= 0 && Number(salen[i]) <= a.falta) }">
                <div class="linea__info">
                  <strong>{{ a.it.productoNombre }}</strong>
                  <small>
                    Pedido {{ formatQty(a.it.cantidad) }} {{ a.it.unidad }}
                    <template v-if="a.salio"> · ya salieron {{ formatQty(a.salio) }}</template>
                    · faltan <b>{{ formatQty(a.falta) }}</b>
                  </small>
                </div>
                <input
                  v-model.number="salen[i]"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  :max="a.falta"
                  :disabled="a.falta === 0"
                  class="linea__qty"
                  :aria-label="`Cuánto sale ahora de ${a.it.productoNombre}`"
                />
              </li>
            </ul>
            <small v-if="!lineasValidas" class="falta">Cada cantidad debe estar entre 0 y lo que falta.</small>
            <small v-else-if="!algoSale" class="falta">Pon cuánto sale en esta entrega.</small>
            <small v-else-if="!completa" class="parcial">
              <i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i> Entrega parcial: el pedido sigue por despachar con lo que falta.
            </small>
          </div>

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
              <button
                type="button"
                class="modal__save"
                :disabled="guardando || subiendo || (!yaSalio && (!lineasValidas || !algoSale))"
                @click="confirmar"
              >
                <BaseSpinner v-if="guardando" :size="14" light />
                {{ yaSalio ? 'Guardar fotos' : !completa ? 'Confirmar entrega parcial' : yaHuboEntregas ? 'Confirmar última entrega' : 'Confirmar salida' }}
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
.lineas { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.linea {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 10px;
  font-family: $font-secondary;
  &.is-error { border-color: $alert-error; }
  &__info { flex: 1; min-width: 0;
    strong { display: block; font-size: 0.82rem; font-weight: 700; overflow-wrap: anywhere; }
    small { font-size: 0.7rem; color: var(--text-faint); b { color: var(--text); } } }
  &__qty { width: 92px; min-height: 42px; padding: 6px 8px; border: 1px solid var(--border-strong); border-radius: 8px;
    font-family: $font-secondary; font-size: 0.95rem; font-weight: 700; text-align: right; color: var(--text); background: var(--surface);
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
    &:disabled { opacity: 0.5; } }
}
.falta { display: block; margin-top: 6px; font-family: $font-secondary; font-size: 0.72rem; color: darken($alert-warning, 22%); }
.parcial { display: flex; gap: 6px; align-items: center; margin-top: 6px; padding: 8px 10px; border-radius: 9px;
  background: $alert-warning-bg; font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; color: darken($alert-warning, 28%); }
.obs {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
  font-family: $font-secondary; font-size: 0.88rem; color: var(--text); background: var(--surface); resize: vertical;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
</style>
