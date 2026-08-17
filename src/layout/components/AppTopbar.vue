<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

defineEmits<{ 'toggle-sidebar': [] }>()

const route = useRoute()
const title = computed(() => (route.meta.title as string) || 'Panel')

const today = new Date().toLocaleDateString('es-EC', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
</script>

<template>
  <header class="topbar">
    <button
      class="topbar__menu"
      type="button"
      aria-label="Abrir menú"
      @click="$emit('toggle-sidebar')"
    >
      <i class="fa-solid fa-bars"></i>
    </button>

    <div class="topbar__crumb">
      <span class="topbar__app">CRM</span>
      <i class="fa-solid fa-chevron-right topbar__sep"></i>
      <transition name="crumb" mode="out-in">
        <span :key="title" class="topbar__title">{{ title }}</span>
      </transition>
    </div>

    <span class="topbar__date">{{ today }}</span>
  </header>
</template>

<style lang="scss" scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 58px;
  padding: 0 24px;
  background: rgba(#f5f7fa, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);

  &__menu {
    display: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;

    i {
      font-size: 1rem;
    }

    @media (max-width: 960px) {
      display: grid;
    }
  }

  &__crumb {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-faint);
  }

  &__sep {
    font-size: 0.6rem;
  }

  &__app {
    font-family: $font-secondary;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  &__title {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text);
  }

  &__date {
    margin-left: auto;
    font-family: $font-secondary;
    font-size: 0.76rem;
    color: var(--text-faint);
    text-transform: capitalize;

    @media (max-width: 640px) {
      display: none;
    }
  }
}

.crumb-enter-active,
.crumb-leave-active {
  transition: opacity 0.18s ease, transform 0.18s var(--ease-out);
}
.crumb-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.crumb-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
