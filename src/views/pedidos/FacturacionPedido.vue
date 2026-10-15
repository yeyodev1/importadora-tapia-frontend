<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePedidosStore } from '@/stores/pedidos'
import { useUserStore } from '@/stores/user'
import { horaCorta } from './estadoPedido'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Facturación en el ERP de un pedido aprobado. El ERP descuenta el stock al
 * facturar, no al aprobar: mientras no esté facturado, el pedido aparta su
 * stock en la app. Lo marca quien factura: administración o bodega (Josué).
 */
const props = defineProps<{ pedido: Pedido }>()
const pedidos = usePedidosStore()
const userStore = useUserStore()

const numero = ref('')
const guardando = ref(false)
const error = ref('')

/** Quien factura: administración o bodega. */
const factura = computed(() => userStore.isAdmin || userStore.isBodega)
const salio = computed(() => !!props.pedido.despacho?.salidaAt || !!props.pedido.entregas?.length)

async function guardar(facturado: boolean) {
  if (guardando.value) return
  guardando.value = true
  error.value = ''
  try {
    await pedidos.setFacturado(props.pedido._id, facturado, numero.value.trim() || undefined)
    numero.value = ''
  } catch (e) {
    error.value = (e as ApiError)?.message || 'No se pudo guardar'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div v-if="pedido.estado === 'aprobado'" class="fact">
    <p v-if="pedido.facturacion" class="fact__ok">
      <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i>
      Facturado en el ERP<template v-if="pedido.facturacion.numeroFactura"> · Factura {{ pedido.facturacion.numeroFactura }}</template>
      <small>{{ pedido.facturacion.por }} · {{ horaCorta(pedido.facturacion.at) }}</small>
      <button v-if="factura && !salio" type="button" class="fact__undo" :disabled="guardando" @click="guardar(false)">
        Aún no está facturado
      </button>
    </p>
    <p v-else-if="salio" class="fact__ok">
      <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i> Ya salió de bodega: el ERP ya lo descontó del stock.
    </p>
    <div v-else class="fact__pend">
      <p>
        <i class="fa-solid fa-box-archive" aria-hidden="true"></i>
        <strong>Por facturar:</strong> su stock queda apartado y nadie más lo puede vender.
        <template v-if="factura"> Cuando lo factures en el ERP, márcalo aquí.</template>
      </p>
      <form v-if="factura" class="fact__form" @submit.prevent="guardar(true)">
        <input v-model="numero" type="text" inputmode="numeric" maxlength="40" placeholder="N.º de factura (opcional)" aria-label="Número de factura" />
        <button type="submit" :disabled="guardando">
          <i class="fa-solid" :class="guardando ? 'fa-spinner fa-spin' : 'fa-check'" aria-hidden="true"></i> Ya está facturado
        </button>
      </form>
    </div>
    <small v-if="error" class="fact__err" role="alert">{{ error }}</small>
  </div>
</template>

<style lang="scss" scoped>
.fact { margin-top: 10px; font-family: $font-secondary; font-size: 0.78rem; }
.fact__ok { padding: 8px 12px; border-radius: 9px; background: rgba($secondary, 0.1); color: darken($secondary, 18%); overflow-wrap: anywhere;
  i { margin-right: 6px; }
  small { display: block; font-size: 0.68rem; opacity: 0.85; margin-top: 3px; } }
.fact__undo { margin-top: 6px; background: none; border: none; padding: 4px 0; cursor: pointer; font-family: $font-secondary;
  font-size: 0.72rem; font-weight: 700; color: var(--text-soft); text-decoration: underline;
  &:disabled { opacity: 0.6; cursor: default; } }
.fact__pend { padding: 10px 12px; border-radius: 10px; background: $alert-warning-bg; border: 1px solid rgba($alert-warning, 0.45);
  color: darken($alert-warning, 28%);
  p { overflow-wrap: anywhere; }
  i { margin-right: 6px; } }
.fact__form { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
  input { flex: 1 1 160px; min-width: 0; min-height: 40px; padding: 8px 12px; border: 1.5px solid var(--border-strong); border-radius: 8px;
    background: var(--surface); color: var(--text); font-family: $font-secondary; font-size: 0.8rem;
    &:focus { outline: none; border-color: $primary; } }
  button { flex: 0 0 auto; min-height: 40px; padding: 8px 14px; border: none; border-radius: 8px; background: $primary; color: $white;
    font-family: $font-principal; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
    &:disabled { opacity: 0.7; cursor: default; } } }
.fact__err { display: block; margin-top: 6px; color: $alert-error; font-weight: 600; }
</style>
