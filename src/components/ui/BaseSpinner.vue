<script setup lang="ts">
withDefaults(defineProps<{ size?: number; light?: boolean }>(), {
  size: 18,
  light: false,
})
</script>

<template>
  <span
    class="spinner"
    :class="{ 'spinner--light': light }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="status"
    aria-label="Cargando"
  />
</template>

<style lang="scss" scoped>
.spinner {
  display: inline-block;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid rgba($primary, 0.2);
  border-top-color: $primary;
  animation: spin 0.7s linear infinite;

  &--light {
    border-color: rgba($white, 0.3);
    border-top-color: $white;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
