<script setup lang="ts">
defineProps<{ page: number; totalPages: number }>()
defineEmits<{ prev: []; next: [] }>()
</script>

<template>
  <footer class="pagination">
    <button type="button" :disabled="page === 1" @click="$emit('prev')">Anterior</button>
    <span>Página {{ page }} de {{ totalPages }}</span>
    <button type="button" :disabled="page === totalPages" @click="$emit('next')">
      Siguiente
    </button>
  </footer>
</template>

<style lang="scss" scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  font-family: $font-secondary;
  font-size: 0.78rem;
  color: var(--text-soft);

  button {
    padding: 6px 12px;
    border: 1px solid var(--border-strong);
    border-radius: 6px;
    background: var(--surface);
    font-family: $font-principal;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover:not(:disabled) {
      border-color: $primary;
      color: $primary;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
}
</style>
