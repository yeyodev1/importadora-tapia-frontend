<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { erpService } from '@/services/erp.service'
import { formatQty } from '@/utils/format'
import type { InventarioItem } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Mercadería que sale en camión a otra bodega (p.ej. Quito). Bodega hace el
 * egreso en el ERP uno o dos días después: mientras tanto se aparta aquí para
 * que los asesores vean el disponible real.
 */
const props = defineProps<{ producto: InventarioItem }>()
const emit = defineEmits<{ separado: [] }>()

const cantidad = ref<number | ''>('')
const destino = ref('Quito')
const guardando = ref(false)
const error = ref('')
const libre = computed(() => Number(props.producto.disponible ?? props.producto.stock_actual) || 0)

async function separar() {
  if (guardando.value) return
  const n = Number(cantidad.value)
  if (!(n > 0)) return void (error.value = 'Indica cuánto va en el camión')
  if (n > libre.value) return void (error.value = `Solo hay ${formatQty(libre.value)} disponibles`)
  if (destino.value.trim().length < 2) return void (error.value = 'Indica a dónde va')
  guardando.value = true
  error.value = ''
  try {
    await erpService.separarTraslado({
      productoCodigo: props.producto.pro_codigo,
      bodega: props.producto.bod_nombre,
      cantidad: n,
      destino: destino.value.trim(),
    })
    cantidad.value = ''
    emit('separado')
  } catch (e) {
    error.value = (e as ApiError)?.message || 'No se pudo separar'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <form class="separar" aria-labelledby="separar-titulo" @submit.prevent="separar">
    <h3 id="separar-titulo">Separar para traslado</h3>
    <p class="separar__ayuda">
      Lo que ya va en camión a otra bodega. Se descuenta del disponible hasta que el ERP haga el egreso
      (confírmalo arriba con «Ya salió en el ERP»; si nadie lo confirma se libera solo a los 3 días).
    </p>
    <div class="separar__fila">
      <label class="separar__campo">
        <span>{{ producto.uni_nombre }}</span>
        <input v-model.number="cantidad" name="cantidad" type="text" inputmode="decimal" enterkeyhint="next" placeholder="Ej. 220" required @input="error = ''" />
      </label>
      <label class="separar__campo separar__campo--ancho">
        <span>Va a</span>
        <input v-model="destino" name="destino" type="text" maxlength="120" enterkeyhint="done" required @input="error = ''" />
      </label>
    </div>
    <p v-if="error" class="separar__error" role="alert">{{ error }}</p>
    <button type="submit" class="separar__btn" :disabled="guardando">
      <BaseSpinner v-if="guardando" :size="12" light />
      Separar
    </button>
  </form>
</template>

<style lang="scss" scoped>
.separar { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; margin-bottom: 10px; border-top: 1px solid var(--border);
  font-family: $font-secondary;
  h3 { font-family: $font-principal; font-size: 0.86rem; font-weight: 700; }
  &__ayuda { font-size: 0.72rem; color: var(--text-soft); }
  &__fila { display: flex; flex-wrap: wrap; gap: 8px; }
  &__campo { display: flex; flex-direction: column; gap: 4px; flex: 1 1 110px;
    span { font-size: 0.72rem; font-weight: 600; color: var(--text-soft); }
    input { min-height: 44px; padding: 8px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
      font: inherit; font-size: max(1rem, 1em); font-weight: 700; color: var(--text); background: var(--surface);
      &:focus-visible { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); } }
    &--ancho { flex: 2 1 160px; } }
  &__error { font-size: 0.74rem; font-weight: 600; color: $alert-error; }
  &__btn { align-self: flex-end; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 8px 16px;
    border: none; border-radius: 8px; background: $primary; color: $white; cursor: pointer;
    font-family: $font-principal; font-size: 0.8rem; font-weight: 700;
    &:disabled { opacity: 0.7; cursor: default; } }
}
</style>
