<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { usePedidosStore } from '@/stores/pedidos'
import { formatMoney, formatQty } from '@/utils/format'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Administración cambia cantidades o quita líneas de un pedido que aún no sale
 * (p.ej. el cliente pidió 100 y solo le tocan 97, o ahora quiere más). Subir
 * se valida contra el stock disponible y el cupo del asesor. Se le avisa al asesor.
 */
const props = defineProps<{ pedido: Pedido | null }>()
const emit = defineEmits<{ close: [] }>()

const store = usePedidosStore()

const cantidades = ref<number[]>([])
const nota = ref('')
const guardando = ref(false)
const error = ref('')

watch(
  () => props.pedido,
  (p) => {
    if (!p) return
    cantidades.value = p.items.map((i) => i.cantidad)
    nota.value = ''
    error.value = ''
  },
)

const lineas = computed(() =>
  (props.pedido?.items || []).map((it, i) => {
    const nueva = Number(cantidades.value[i])
    const valida = Number.isFinite(nueva) && nueva >= 0
    return { it, nueva, valida, cambia: valida && nueva !== it.cantidad }
  }),
)
const nuevoTotal = computed(() =>
  lineas.value.reduce((s, l) => s + (l.valida ? l.nueva : l.it.cantidad) * l.it.precioUnitario, 0),
)
const invalida = computed(() => lineas.value.some((l) => !l.valida))
const sinCambios = computed(() => !lineas.value.some((l) => l.cambia))
const vacio = computed(() => lineas.value.every((l) => l.valida && l.nueva === 0))
const puedeGuardar = computed(() => !guardando.value && !invalida.value && !sinCambios.value && !vacio.value)

function quitar(i: number) {
  cantidades.value[i] = 0
}

async function guardar() {
  if (!props.pedido || !puedeGuardar.value) return
  guardando.value = true
  error.value = ''
  try {
    await store.ajustar(props.pedido._id, cantidades.value.map(Number), nota.value.trim() || undefined)
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo ajustar el pedido. Vuelve a intentar.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="pedido" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="ajustar-titulo">
          <header class="modal__head">
            <div>
              <h2 id="ajustar-titulo">Editar cantidades {{ pedido.numero }}</h2>
              <p class="modal__hint">{{ pedido.clienteNombre }} · {{ pedido.vendedorNombre }}</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <p class="ayuda">Sube o baja la cantidad. Lo que bajes vuelve al stock y al cupo del asesor; lo que subas debe haber en stock y caber en su cupo.</p>

          <ul class="lineas">
            <li v-for="(l, i) in lineas" :key="i" class="linea" :class="{ 'is-cambia': l.cambia, 'is-error': !l.valida }">
              <div class="linea__info">
                <strong>{{ l.it.productoNombre }}</strong>
                <small>Pidió {{ formatQty(l.it.cantidad) }} {{ l.it.unidad }} × {{ formatMoney(l.it.precioUnitario) }}</small>
              </div>
              <input
                v-model.number="cantidades[i]"
                type="number"
                inputmode="decimal"
                min="0"
                class="linea__qty"
                :aria-label="`Nueva cantidad de ${l.it.productoNombre}`"
              />
              <button type="button" class="linea__x" :disabled="l.nueva === 0" title="Quitar este producto" @click="quitar(i)">
                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
          <small v-if="invalida" class="falta">Revisa las cantidades: deben ser 0 o más.</small>
          <small v-else-if="vacio" class="falta">El pedido quedaría vacío: mejor anúlalo.</small>

          <div class="field">
            <textarea v-model="nota" rows="2" class="obs" maxlength="500" placeholder="Mensaje para el asesor (opcional), p. ej. «El cliente subió a 120»"></textarea>
          </div>

          <p class="total">Nuevo total <b>{{ formatMoney(nuevoTotal) }}</b> <span>antes {{ formatMoney(pedido.total) }}</span></p>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
              <button type="button" class="modal__save" :disabled="!puedeGuardar" @click="guardar">
                <BaseSpinner v-if="guardando" :size="14" light />
                Guardar y avisar al asesor
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
.lineas { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.linea {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 10px;
  font-family: $font-secondary;
  &.is-cambia { border-color: $alert-warning; background: $alert-warning-bg; }
  &.is-error { border-color: $alert-error; }
  &__info { flex: 1; min-width: 0;
    strong { display: block; font-size: 0.82rem; font-weight: 700; overflow-wrap: anywhere; }
    small { font-size: 0.7rem; color: var(--text-faint); } }
  &__qty { width: 84px; min-height: 40px; padding: 6px 8px; border: 1px solid var(--border-strong); border-radius: 8px;
    font-family: $font-secondary; font-size: 0.9rem; font-weight: 700; text-align: right; color: var(--text); background: var(--surface);
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); } }
  &__x { width: 40px; height: 40px; flex-shrink: 0; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--surface);
    color: var(--text-faint); cursor: pointer;
    &:hover:not(:disabled) { border-color: $alert-error; color: $alert-error; }
    &:disabled { opacity: 0.4; cursor: default; } }
}
.obs {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
  font-family: $font-secondary; font-size: 0.88rem; color: var(--text); background: var(--surface); resize: vertical;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
.falta { display: block; margin-bottom: 8px; font-family: $font-secondary; font-size: 0.7rem; color: darken($alert-warning, 22%); }
.total { margin-top: 10px; font-family: $font-secondary; font-size: 0.82rem;
  b { font-weight: 800; font-variant-numeric: tabular-nums; }
  span { margin-left: 6px; font-size: 0.72rem; color: var(--text-faint); text-decoration: line-through; } }
</style>
