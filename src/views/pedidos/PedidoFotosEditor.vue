<script setup lang="ts">
import { ref, watch } from 'vue'
import FotoOrdenPedido from './FotoOrdenPedido.vue'
import { usePedidosStore } from '@/stores/pedidos'
import type { Pedido } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Fotos de la OP en un pedido ya enviado: tomar otra, quitar o cambiar.
 * Cada cambio se guarda solo; si falla, se vuelve a lo último guardado.
 */
const props = defineProps<{ pedido: Pedido }>()
const store = usePedidosStore()

function fotosDelPedido(): string[] {
  if (props.pedido.fotos?.length) return [...props.pedido.fotos]
  return props.pedido.fotoUrl ? [props.pedido.fotoUrl] : []
}

const fotos = ref<string[]>(fotosDelPedido())
const guardando = ref(false)
const guardado = ref(false)
const error = ref('')
let ultimoGuardado = JSON.stringify(fotos.value)

watch(fotos, async (lista) => {
  const json = JSON.stringify(lista)
  if (json === ultimoGuardado) return
  guardando.value = true
  guardado.value = false
  error.value = ''
  try {
    await store.setFotos(props.pedido._id, lista)
    ultimoGuardado = json
    guardado.value = true
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudieron guardar las fotos. Vuelve a intentar.'
    fotos.value = JSON.parse(ultimoGuardado)
  } finally {
    guardando.value = false
  }
})
</script>

<template>
  <section class="pfe">
    <header class="pfe__head">
      <strong><i class="fa-solid fa-camera"></i> Fotos de la orden de pedido</strong>
      <small v-if="guardando"><i class="fa-solid fa-spinner fa-spin"></i> Guardando…</small>
      <small v-else-if="guardado" class="is-ok"><i class="fa-solid fa-circle-check"></i> Guardado</small>
    </header>
    <FotoOrdenPedido v-model="fotos" />
    <p v-if="error" class="pfe__err" role="alert">{{ error }}</p>
  </section>
</template>

<style lang="scss" scoped>
.pfe {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;

    strong {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 0.84rem;
      font-weight: 700;
      i { color: $primary; }
    }

    small {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: $font-secondary;
      font-size: 0.72rem;
      color: var(--text-soft);
      &.is-ok { color: darken($secondary, 15%); }
    }
  }

  &__err {
    font-family: $font-secondary;
    font-size: 0.76rem;
    color: darken($alert-error, 8%);
    background: $alert-error-bg;
    border-radius: 8px;
    padding: 8px 10px;
  }
}
</style>
