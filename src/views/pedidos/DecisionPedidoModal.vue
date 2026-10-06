<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { usePedidosStore } from '@/stores/pedidos'
import { formatMoney } from '@/utils/format'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/** Administración decide un pedido: aprobar, poner en espera o rechazar, con mensaje para el asesor. */
export type Decision = 'aprobado' | 'en_espera' | 'rechazado'

const props = defineProps<{ pedido: Pedido | null; accion: Decision }>()
const emit = defineEmits<{ close: [] }>()

const store = usePedidosStore()

const OPCIONES: Record<Decision, { label: string; icono: string; tono: string; ayuda: string; boton: string; sugerencias: string[]; placeholder: string }> = {
  aprobado: {
    label: 'Aprobar',
    icono: 'fa-circle-check',
    tono: 'is-ok',
    ayuda: 'Pasa a bodega para despachar. El comentario es opcional.',
    boton: 'Aprobar pedido',
    sugerencias: ['Transferencia OK, pedido aprobado', 'Pedido aprobado'],
    placeholder: 'Comentario para el asesor (opcional)',
  },
  en_espera: {
    label: 'En espera',
    icono: 'fa-circle-pause',
    tono: 'is-aviso',
    ayuda: 'Queda sin aprobar y el asesor ve tu mensaje. Luego podrás aprobarlo o no aprobarlo.',
    boton: 'Poner en espera',
    sugerencias: ['En espera hasta que el asesor respalde facturas pendientes del cliente'],
    placeholder: 'Mensaje para el asesor (obligatorio)',
  },
  rechazado: {
    label: 'No aprobar',
    icono: 'fa-ban',
    tono: 'is-peligro',
    ayuda: 'No se despacha. El motivo es opcional pero ayuda al asesor.',
    boton: 'No aprobar pedido',
    sugerencias: [],
    placeholder: 'Motivo (opcional)',
  },
}

const ORDEN: Decision[] = ['aprobado', 'en_espera', 'rechazado']
const decision = ref<Decision>('aprobado')
const texto = ref('')
const guardando = ref(false)
const error = ref('')
/** Rechazar pide un segundo toque antes de enviar. */
const confirmando = ref(false)

const yaEnEspera = computed(() => props.pedido?.estado === 'en_espera')
const opcion = computed(() => OPCIONES[decision.value])

function elegir(d: Decision) {
  decision.value = d
  confirmando.value = false
  error.value = ''
  // Si ya está en espera, al volver a "En espera" se edita el mensaje vigente.
  texto.value = d === 'en_espera' && yaEnEspera.value ? props.pedido?.motivoEspera || '' : ''
}

watch(
  () => props.pedido,
  (p) => {
    if (p) elegir(props.accion)
  },
)

function usarSugerencia(s: string) {
  texto.value = texto.value.trim() === s ? '' : s
}

const comentario = computed(() => texto.value.trim())
const puedeGuardar = computed(() => !guardando.value && (decision.value !== 'en_espera' || comentario.value.length >= 3))
const textoBoton = computed(() => {
  if (confirmando.value) return 'Sí, no aprobar pedido'
  if (decision.value === 'en_espera' && yaEnEspera.value) return 'Actualizar mensaje'
  return opcion.value.boton
})

async function confirmar() {
  if (!props.pedido || !puedeGuardar.value) return
  if (decision.value === 'rechazado' && !confirmando.value) {
    confirmando.value = true
    return
  }
  guardando.value = true
  error.value = ''
  try {
    await store.setEstado(props.pedido._id, decision.value, comentario.value || undefined)
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo guardar la decisión. Vuelve a intentar.'
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
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="decision-titulo">
          <header class="modal__head">
            <div>
              <h2 id="decision-titulo">Decidir pedido {{ pedido.numero }}</h2>
              <p class="modal__hint">{{ pedido.clienteNombre }} · {{ formatMoney(pedido.total) }} · {{ pedido.vendedorNombre }}</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <div class="decisiones" role="radiogroup" aria-label="Decisión">
            <button
              v-for="d in ORDEN"
              :key="d"
              type="button"
              role="radio"
              class="dec"
              :class="[OPCIONES[d].tono, { 'is-on': decision === d }]"
              :aria-checked="decision === d"
              @click="elegir(d)"
            >
              <i class="fa-solid" :class="OPCIONES[d].icono" aria-hidden="true"></i>
              {{ d === 'en_espera' && yaEnEspera ? 'Editar espera' : OPCIONES[d].label }}
            </button>
          </div>

          <p class="ayuda">{{ opcion.ayuda }}</p>

          <div class="field">
            <div v-if="opcion.sugerencias.length" class="sugs">
              <button
                v-for="s in opcion.sugerencias"
                :key="s"
                type="button"
                class="sug"
                :class="{ 'is-on': comentario === s }"
                :aria-pressed="comentario === s"
                @click="usarSugerencia(s)"
              >{{ s }}</button>
            </div>
            <textarea v-model="texto" rows="3" class="obs" maxlength="500" :placeholder="opcion.placeholder"></textarea>
            <small v-if="decision === 'en_espera' && comentario.length < 3" class="falta">Escribe el mensaje para el asesor.</small>
          </div>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="confirmando ? (confirmando = false) : emit('close')">
                {{ confirmando ? 'No, volver' : 'Cancelar' }}
              </button>
              <button type="button" class="modal__save" :class="opcion.tono" :disabled="!puedeGuardar" @click="confirmar">
                <BaseSpinner v-if="guardando" :size="14" light />
                {{ textoBoton }}
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

.decisiones { display: flex; gap: 8px; margin-bottom: 10px; }
.dec {
  flex: 1 1 0; min-width: 0; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 6px; border: 1.5px solid var(--border-strong); border-radius: 10px; background: var(--surface);
  font-family: $font-principal; font-size: 0.78rem; font-weight: 700; color: var(--text); cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  &:hover { border-color: $primary; }
  &.is-on.is-ok { border-color: $secondary; background: rgba($secondary, 0.1); color: darken($secondary, 14%); }
  &.is-on.is-aviso { border-color: $alert-warning; background: $alert-warning-bg; color: darken($alert-warning, 25%); }
  &.is-on.is-peligro { border-color: $alert-error; background: $alert-error-bg; color: darken($alert-error, 6%); }
}
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
.modal__save.is-aviso:not(:disabled) { background: darken($alert-warning, 8%); }
.modal__save.is-peligro:not(:disabled) { background: $alert-error; }
</style>
