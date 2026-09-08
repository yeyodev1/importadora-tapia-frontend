<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

/** Selector con estilos propios (reemplaza al <select> nativo). */
export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    placeholder?: string
    ariaLabel?: string
    disabled?: boolean
  }>(),
  { placeholder: 'Seleccionar…', ariaLabel: 'Seleccionar', disabled: false },
)

const model = defineModel<string>({ required: true })

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const selected = computed(() => props.options.find((o) => o.value === model.value) || null)

function choose(value: string) {
  model.value = value
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="bsel" :class="{ 'is-open': open, 'is-disabled': disabled }">
    <button
      type="button"
      class="bsel__trigger"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <span class="bsel__value" :class="{ 'is-placeholder': !selected }">{{ selected?.label || placeholder }}</span>
      <i class="fa-solid fa-chevron-down"></i>
    </button>

    <transition name="bsel-drop">
      <ul v-if="open" class="bsel__list" role="listbox">
        <li
          v-for="o in options"
          :key="o.value"
          role="option"
          :aria-selected="o.value === model"
          :class="{ 'is-selected': o.value === model }"
          @click="choose(o.value)"
        >
          <span>{{ o.label }}</span>
          <i v-if="o.value === model" class="fa-solid fa-check"></i>
        </li>
      </ul>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.bsel {
  position: relative;
  min-width: 0;
  width: 100%;

  @media (min-width: 560px) { width: auto; min-width: 200px; }

  &__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    font-family: $font-secondary;
    font-size: 0.82rem;
    color: var(--text);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    i { font-size: 0.7rem; color: var(--text-faint); transition: transform 0.2s var(--ease-out); }
    &:hover { border-color: $primary; }
    &:focus-visible { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &.is-open &__trigger { border-color: $primary; i { transform: rotate(180deg); } }

  &__value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    &.is-placeholder { color: var(--text-faint); }
  }

  &__list {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 260px;
    overflow-y: auto;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-pop);

    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 10px;
      border-radius: 7px;
      font-family: $font-secondary;
      font-size: 0.82rem;
      color: var(--text);
      cursor: pointer;

      i { color: $primary; font-size: 0.72rem; }
      &:hover { background: rgba($primary-dark, 0.05); }
      &.is-selected { background: var(--accent-soft); color: $primary; font-weight: 700; }
    }
  }
}

.bsel-drop-enter-active,
.bsel-drop-leave-active { transition: opacity 0.18s ease, transform 0.18s var(--ease-out); }
.bsel-drop-enter-from,
.bsel-drop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
