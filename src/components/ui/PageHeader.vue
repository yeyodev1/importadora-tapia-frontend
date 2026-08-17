<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    count?: number | null
    refreshing?: boolean
    /** 'erp' = dato del sistema de Tapia (solo lectura); 'local' = se gestiona en esta app */
    source?: 'erp' | 'local' | null
  }>(),
  { subtitle: '', count: null, refreshing: false, source: null },
)

defineEmits<{ refresh: [] }>()
</script>

<template>
  <header class="page-header">
    <div>
      <h1 class="page-header__title">
        {{ title }}
        <span v-if="count !== null" class="page-header__count">{{
          count.toLocaleString('es-EC')
        }}</span>
        <span
          v-if="source"
          class="page-header__source"
          :class="`is-${source}`"
          :title="
            source === 'erp'
              ? 'Estos datos vienen del sistema de Importadora Tapia. Aquí solo se consultan; cualquier cambio se hace en ese sistema.'
              : 'Estos datos se crean y administran en esta aplicación.'
          "
        >
          <i :class="source === 'erp' ? 'fa-solid fa-database' : 'fa-solid fa-pen-to-square'"></i>
          {{ source === 'erp' ? 'ERP · solo lectura' : 'Se gestiona aquí' }}
        </span>
      </h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>

    <div class="page-header__actions">
      <slot name="actions" />
      <button
        class="page-header__refresh"
        type="button"
        :disabled="refreshing"
        @click="$emit('refresh')"
      >
        <BaseSpinner v-if="refreshing" :size="14" />
        <i v-else class="fa-solid fa-arrows-rotate"></i>
        Actualizar
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;

  &__title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: 1.45rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  &__count {
    font-family: $font-secondary;
    font-size: 0.8rem;
    font-weight: 600;
    color: $primary;
    background: var(--accent-soft);
    border-radius: 999px;
    padding: 2px 10px;
  }

  &__source {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: $font-secondary;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    border-radius: 999px;
    padding: 3px 10px;
    cursor: help;

    i {
      font-size: 0.62rem;
    }

    &.is-erp {
      color: rgba($primary-dark, 0.55);
      background: rgba($primary-dark, 0.06);
    }

    &.is-local {
      color: darken($secondary, 14%);
      background: rgba($secondary, 0.12);
    }
  }

  &__subtitle {
    margin-top: 4px;
    font-family: $font-secondary;
    font-size: 0.85rem;
    color: var(--text-soft);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__refresh {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font-family: $font-principal;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;

    i {
      font-size: 0.8rem;
    }

    &:hover:not(:disabled) {
      border-color: $primary;
      color: $primary;
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.7;
      cursor: default;
    }
  }
}
</style>
