<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message?: string
    tone?: 'empty' | 'error'
  }>(),
  {
    title: 'Sin resultados',
    message: 'No hay datos que coincidan con la búsqueda.',
    tone: 'empty',
  },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="state" :class="`state--${tone}`">
    <div class="state__icon">
      <i :class="tone === 'empty' ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-circle-exclamation'"></i>
    </div>
    <h3 class="state__title">{{ title }}</h3>
    <p class="state__message">{{ message }}</p>
    <button v-if="tone === 'error'" class="state__retry" type="button" @click="$emit('retry')">
      Reintentar
    </button>
  </div>
</template>

<style lang="scss" scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 56px 24px;
  text-align: center;

  &__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    margin-bottom: 8px;
    color: var(--text-faint);
    background: rgba($primary-dark, 0.05);

    i {
      font-size: 1.15rem;
    }
  }

  &--error &__icon {
    color: $alert-error;
    background: $alert-error-bg;
  }

  &__title {
    font-size: 0.95rem;
    font-weight: 700;
  }

  &__message {
    font-family: $font-secondary;
    font-size: 0.83rem;
    color: var(--text-soft);
    max-width: 360px;
  }

  &__retry {
    margin-top: 14px;
    padding: 8px 18px;
    border: none;
    border-radius: 8px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-weight: 600;
    font-size: 0.83rem;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease;

    &:hover {
      background: darken($primary, 6%);
      transform: translateY(-1px);
    }
  }
}
</style>
