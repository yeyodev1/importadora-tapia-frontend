<script setup lang="ts">
withDefaults(defineProps<{ rows?: number; cols?: number }>(), {
  rows: 8,
  cols: 5,
})
</script>

<template>
  <div class="skeleton-table" aria-hidden="true">
    <div class="skeleton-table__head">
      <span
        v-for="c in cols"
        :key="`h${c}`"
        class="skeleton"
        :style="{ width: `${55 + ((c * 37) % 40)}%` }"
      />
    </div>
    <div
      v-for="r in rows"
      :key="`r${r}`"
      class="skeleton-table__row stagger-item"
      :style="{ '--i': r }"
    >
      <span
        v-for="c in cols"
        :key="`c${c}`"
        class="skeleton"
        :style="{ width: `${45 + (((r + c) * 53) % 50)}%` }"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.skeleton-table {
  &__head,
  &__row {
    display: grid;
    grid-template-columns: repeat(v-bind(cols), 1fr);
    gap: 24px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
  }

  &__head .skeleton {
    height: 10px;
    opacity: 0.7;
  }

  &__row .skeleton {
    height: 13px;
  }

  &__row:last-child {
    border-bottom: none;
  }
}
</style>
