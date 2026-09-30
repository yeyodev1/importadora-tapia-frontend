<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { usePedidosStore } from '@/stores/pedidos'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/** El pedido no sale hoy: bodega elige la nueva fecha de salida y explica por qué. */
const props = defineProps<{ pedido: Pedido | null }>()
const emit = defineEmits<{ close: [] }>()

const store = usePedidosStore()
const MOTIVOS = ['Sin stock físico', 'Sin transporte', 'Falta de personal', 'Cliente no puede recibir', 'Producto en mal estado']

const fecha = ref('')
const motivo = ref('')
const detalle = ref('')
const guardando = ref(false)
const error = ref('')

/** Próximos 10 días (desde mañana) como botones: sin calendario nativo. */
const dias = computed(() => {
  const out: { ymd: string; dia: string; num: string; mes: string }[] = []
  const hoy = new Date()
  for (let i = 1; i <= 10; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i)
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({
      ymd,
      dia: i === 1 ? 'Mañana' : d.toLocaleDateString('es-EC', { weekday: 'short' }),
      num: String(d.getDate()),
      mes: d.toLocaleDateString('es-EC', { month: 'short' }),
    })
  }
  return out
})

watch(
  () => props.pedido,
  (p) => {
    if (!p) return
    fecha.value = ''
    motivo.value = ''
    detalle.value = ''
    error.value = ''
  },
)

const textoMotivo = computed(() => [motivo.value, detalle.value.trim()].filter(Boolean).join(': '))
const puedeGuardar = computed(() => !guardando.value && !!fecha.value && textoMotivo.value.length >= 3)

async function confirmar() {
  if (!props.pedido || !puedeGuardar.value) return
  guardando.value = true
  error.value = ''
  try {
    await store.registrarRetraso(props.pedido._id, { nuevaFecha: fecha.value, motivo: textoMotivo.value })
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo registrar el retraso. Vuelve a intentar.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="pedido" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="retraso-titulo">
          <header class="modal__head">
            <div>
              <h2 id="retraso-titulo"><i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i> No sale hoy</h2>
              <p class="modal__hint">{{ pedido.numero }} · {{ pedido.clienteNombre }}. El vendedor y administración reciben el aviso.</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <div class="field">
            <span>¿Cuándo saldrá? <em class="opt">· obligatorio</em></span>
            <div class="dias">
              <button
                v-for="d in dias"
                :key="d.ymd"
                type="button"
                class="dia"
                :class="{ 'is-on': fecha === d.ymd }"
                :aria-pressed="fecha === d.ymd"
                @click="fecha = d.ymd"
              >
                <small>{{ d.dia }}</small><b>{{ d.num }}</b><small>{{ d.mes }}</small>
              </button>
            </div>
          </div>

          <div class="field">
            <span>¿Por qué no salió? <em class="opt">· obligatorio</em></span>
            <div class="motivos">
              <button
                v-for="m in MOTIVOS"
                :key="m"
                type="button"
                class="motivo"
                :class="{ 'is-on': motivo === m }"
                :aria-pressed="motivo === m"
                @click="motivo = motivo === m ? '' : m"
              >{{ m }}</button>
            </div>
            <textarea v-model="detalle" rows="2" class="obs" maxlength="400" placeholder="Detalle (ej.: el camión se dañó, llega mañana a las 9)"></textarea>
          </div>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
              <button type="button" class="modal__save" :disabled="!puedeGuardar" @click="confirmar">
                <BaseSpinner v-if="guardando" :size="14" light />
                Registrar retraso
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

.dias { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.dia {
  display: flex; flex-direction: column; align-items: center; flex-shrink: 0; gap: 1px; min-width: 62px; padding: 8px 6px;
  border: 1.5px solid var(--border-strong); border-radius: 10px; background: var(--surface); cursor: pointer; color: var(--text);
  small { font-family: $font-secondary; font-size: 0.66rem; color: var(--text-soft); text-transform: capitalize; }
  b { font-size: 1.1rem; font-weight: 800; }
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: $primary; color: $white; small { color: rgba($white, 0.85); } }
}
.motivos { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.motivo {
  min-height: 40px; padding: 8px 12px; border: 1.5px solid var(--border-strong); border-radius: 999px; background: var(--surface);
  font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; color: var(--text); cursor: pointer;
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: var(--accent-soft); color: $primary; }
}
.obs {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
  font-family: $font-secondary; font-size: 0.88rem; color: var(--text); background: var(--surface); resize: vertical;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
</style>
