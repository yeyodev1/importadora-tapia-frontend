<script setup lang="ts">
defineProps<{
  placeholder: string
  meta: string
  showMeta: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__search">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input v-model="model" type="search" :placeholder="placeholder" />
    </div>
    <span v-if="showMeta" class="toolbar__meta">{{ meta }}</span>
  </div>
</template>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);

  @media (max-width: 640px) {
    padding: 12px 14px;
  }

  &__search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    max-width: 340px;
    padding: 8px 12px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    color: var(--text-faint);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    @media (max-width: 640px) {
      max-width: none;
    }

    &:focus-within {
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.12);
    }

    i {
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    input {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-family: $font-secondary;
      font-size: 0.85rem;
      color: var(--text);

      &::placeholder {
        color: var(--text-faint);
      }
    }
  }

  &__meta {
    font-family: $font-secondary;
    font-size: 0.76rem;
    font-weight: 500;
    color: var(--text-faint);
    white-space: nowrap;

    @media (max-width: 640px) {
      display: none;
    }
  }
}
</style>
