<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertasPedidos, type AlertaPedido } from '@/composables/useAlertasPedidos'

/** Avisos con sonido de pedidos nuevos o revisados, visibles en cualquier pantalla. */
const router = useRouter()
const { alertas, sonidoListo, iniciar, detener, activar, cerrar } = useAlertasPedidos()

onMounted(iniciar)
onBeforeUnmount(detener)

function ver(a: AlertaPedido) {
  cerrar(a.clave)
  router.push(a.destino)
}

const icono = (a: AlertaPedido) =>
  a.tono === 'mal' ? 'fa-circle-xmark' : a.tono === 'ok' ? 'fa-circle-check' : 'fa-bell fa-shake'
</script>

<template>
  <div class="alertas" aria-live="assertive">
    <button v-if="!sonidoListo" type="button" class="alertas__activar" @click="activar">
      <i class="fa-solid fa-volume-high" aria-hidden="true"></i> Activar alertas con sonido
    </button>

    <div v-for="a in alertas" :key="a.clave" class="alerta" :class="`is-${a.tono}`" role="alert">
      <i class="fa-solid alerta__icono" :class="icono(a)" aria-hidden="true"></i>
      <div class="alerta__txt">
        <strong>{{ a.titulo }}</strong>
        <small>{{ a.detalle }}</small>
      </div>
      <button type="button" class="alerta__ver" @click="ver(a)">Ver</button>
      <button type="button" class="alerta__x" aria-label="Cerrar aviso" @click="cerrar(a.clave)">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.alertas {
  position: fixed;
  z-index: 250;
  top: 76px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  width: min(400px, calc(100vw - 32px));
  pointer-events: none;

  > * { pointer-events: auto; }

  &__activar {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid rgba($primary, 0.4);
    border-radius: 999px;
    background: var(--surface);
    box-shadow: var(--shadow-card);
    color: $primary;
    font-family: $font-secondary;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    &:hover { background: var(--accent-soft); }
  }
}

.alerta {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 12px 12px 14px;
  border-radius: 14px;
  background: $primary-dark;
  color: $white;
  box-shadow: 0 12px 30px rgba($primary-dark, 0.35);
  animation: entrar 0.3s var(--ease-out);

  &__icono { font-size: 1.35rem; color: $primary; }
  &.is-ok .alerta__icono { color: $secondary; }
  &.is-mal .alerta__icono { color: $alert-error; }

  &__txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    strong { font-size: 0.9rem; font-weight: 800; }
    small { font-family: $font-secondary; font-size: 0.74rem; color: rgba($white, 0.75); overflow-wrap: anywhere; }
  }

  &__ver {
    min-height: 40px;
    padding: 0 14px;
    border: none;
    border-radius: 9px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
    &:hover { background: darken($primary, 6%); }
  }

  &__x {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgba($white, 0.7);
    cursor: pointer;
    &:hover { color: $white; background: rgba($white, 0.1); }
  }
}

@keyframes entrar {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .alerta { animation: none; }
}
</style>
