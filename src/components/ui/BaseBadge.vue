<script setup lang="ts">
withDefaults(
  defineProps<{ tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }>(),
  { tone: 'neutral' },
)
</script>

<template>
  <span class="badge" :class="`badge--${tone}`">
    <span class="badge__dot" />
    <slot />
  </span>
</template>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-family: $font-secondary;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &--neutral {
    color: rgba($primary-dark, 0.65);
    background: rgba($primary-dark, 0.06);
  }
  &--success {
    color: darken($alert-success, 12%);
    background: $alert-success-bg;
  }
  &--warning {
    color: darken($alert-warning, 18%);
    background: $alert-warning-bg;
  }
  &--danger {
    color: darken($alert-error, 12%);
    background: $alert-error-bg;
  }
  &--info {
    color: darken($alert-info, 14%);
    background: $alert-info-bg;
  }
}
</style>
