<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { erpService } from '@/services/erp.service'
import { formatQty } from '@/utils/format'
import type { ApiError } from '@/types'

/**
 * Admin: el producto se vende por libra pero sale en saco. Con las libras de
 * cada saco el asesor pide sacos, el pedido guarda las libras (lo que descuenta
 * el ERP) y bodega ve cuántos sacos sacar. Vacío = se vende suelto.
 */
const props = defineProps<{ producto: { pro_codigo: string; pro_nombre: string; uni_nombre: string; libras_por_saco?: number | null } | null }>()
const emit = defineEmits<{ close: []; guardado: [proCodigo: string, librasPorSaco: number | null] }>()

const libras = ref<number | null>(null)
const guardando = ref(false)
const error = ref('')

watch(
  () => props.producto,
  (p) => {
    if (!p) return
    libras.value = p.libras_por_saco || null
    error.value = ''
  },
)

const valido = computed(() => libras.value === null || (Number(libras.value) > 0 && Number(libras.value) <= 10000))

async function guardar(valor: number | null) {
  if (!props.producto || guardando.value) return
  guardando.value = true
  error.value = ''
  try {
    const r = await erpService.guardarReglaProducto(props.producto.pro_codigo, {
      librasPorSaco: valor,
      proNombre: props.producto.pro_nombre,
    })
    emit('guardado', r.proCodigo, r.librasPorSaco ?? null)
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo guardar. Vuelve a intentar.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="producto" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="saco-titulo">
          <header class="modal__head">
            <div>
              <h2 id="saco-titulo">Venta en saco</h2>
              <p class="modal__hint">{{ producto.pro_nombre }} · se factura en {{ producto.uni_nombre }}</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <p class="ayuda">
            Si este producto se cotiza por {{ producto.uni_nombre.toLowerCase() }} pero se entrega en saco, pon cuántas
            {{ producto.uni_nombre.toLowerCase() }} trae cada saco. El asesor pedirá <b>sacos</b> con el precio por
            {{ producto.uni_nombre.toLowerCase().replace(/s$/, '') }}, y el inventario descuenta las {{ producto.uni_nombre.toLowerCase() }} correctas.
          </p>

          <label class="field">
            <span>{{ producto.uni_nombre }} por saco</span>
            <input v-model.number="libras" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Ej. 55" class="qty" />
          </label>
          <p v-if="libras && valido" class="ejemplo">
            Ej.: 10 sacos = <b>{{ formatQty(10 * Number(libras)) }} {{ producto.uni_nombre }}</b>
          </p>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button v-if="producto.libras_por_saco" type="button" class="modal__cancel" :disabled="guardando" @click="guardar(null)">
                Se vende suelto
              </button>
              <button type="button" class="modal__save" :disabled="guardando || !valido || !libras" @click="guardar(Number(libras))">
                <BaseSpinner v-if="guardando" :size="14" light />
                Guardar
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

.ayuda { font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft); margin-bottom: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; font-family: $font-secondary;
  span { font-size: 0.74rem; font-weight: 600; color: var(--text-soft); } }
.qty { padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px; max-width: 160px;
  font-family: $font-secondary; font-size: 1rem; font-weight: 700; color: var(--text); background: var(--surface);
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); } }
.ejemplo { margin-top: 8px; font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); }
</style>
