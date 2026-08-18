<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useUserStore } from '@/stores/user'

const system = useSystemStore()
const userStore = useUserStore()

const visible = computed(() => system.erp && !system.erp.conectado)

const desde = computed(() => {
  const d = system.ultimaSync
  if (!d) return 'sin datos previos'
  return new Date(d).toLocaleString('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <transition name="banner">
    <div v-if="visible" class="erp-banner" role="status">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <div class="erp-banner__text">
        <strong>Sin conexión en vivo con el ERP de Importadora Tapia.</strong>
        Mostrando la última información guardada ({{ desde }}).
        <span v-if="system.motivo" class="erp-banner__motivo">{{ system.motivo }}</span>
        <span v-if="userStore.isAdmin && system.erp?.detalle" class="erp-banner__detalle">
          Detalle técnico: {{ system.erp.detalle }}
        </span>
      </div>
      <button class="erp-banner__retry" type="button" :disabled="system.checking" @click="system.check()">
        <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': system.checking }"></i>
        Reintentar
      </button>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.erp-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 18px;
  background: linear-gradient(90deg, rgba($alert-warning, 0.16), rgba($alert-warning, 0.08));
  border-bottom: 1px solid rgba($alert-warning, 0.35);
  color: darken($alert-warning, 26%);
  font-family: $font-secondary;
  font-size: 0.82rem;
  line-height: 1.5;

  > i {
    font-size: 1rem;
    margin-top: 2px;
    color: darken($alert-warning, 12%);
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    min-width: 0;

    strong {
      font-weight: 700;
    }
  }

  &__motivo {
    display: block;
    margin-top: 2px;
    color: darken($alert-warning, 18%);
  }

  &__detalle {
    display: block;
    margin-top: 4px;
    font-size: 0.72rem;
    opacity: 0.75;
    font-family: $font-secondary;
    word-break: break-word;
  }

  &__retry {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 13px;
    border: 1px solid rgba($alert-warning, 0.5);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.5);
    color: darken($alert-warning, 26%);
    font-family: $font-principal;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.85);
    }
    &:disabled {
      opacity: 0.7;
    }
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    &__retry {
      width: 100%;
      justify-content: center;
    }
  }
}

.banner-enter-active,
.banner-leave-active {
  transition: opacity 0.3s ease, transform 0.3s var(--ease-out);
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
