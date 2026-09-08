<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

/**
 * Confirmación con estilos propios (nunca window.confirm). Para acciones
 * destructivas se confirma DOS veces: primero se explica qué va a pasar y
 * luego se pide ratificar; recién ahí se emite `confirm`.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    /** Lo que está en juego (nombre del registro, etc.), destacado. */
    subject?: string
    confirmLabel?: string
    /** Texto del segundo paso; si es vacío se confirma una sola vez. */
    secondMessage?: string
    secondLabel?: string
    danger?: boolean
    loading?: boolean
    error?: string
  }>(),
  {
    subject: '',
    confirmLabel: 'Continuar',
    secondMessage: '',
    secondLabel: 'Sí, confirmar',
    danger: false,
    loading: false,
    error: '',
  },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const step = ref<1 | 2>(1)

watch(
  () => props.open,
  (open) => {
    if (open) step.value = 1
  },
)

function next() {
  if (props.loading) return
  if (step.value === 1 && props.secondMessage) {
    step.value = 2
    return
  }
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <transition name="cm">
      <div v-if="open" class="cm-backdrop" @click.self="!loading && emit('cancel')">
        <div class="cm" role="alertdialog" aria-modal="true" :class="{ 'is-danger': danger, 'is-step2': step === 2 }">
          <div class="cm__icon">
            <i class="fa-solid" :class="danger ? (step === 2 ? 'fa-triangle-exclamation' : 'fa-trash-can') : 'fa-circle-question'"></i>
          </div>

          <h2>{{ step === 2 ? '¿Seguro?' : title }}</h2>
          <p v-if="subject" class="cm__subject">{{ subject }}</p>
          <p class="cm__msg">{{ step === 2 ? secondMessage : message }}</p>

          <ol v-if="secondMessage" class="cm__steps" aria-label="Pasos de confirmación">
            <li :class="{ 'is-on': step === 1, 'is-done': step === 2 }">Revisar</li>
            <li :class="{ 'is-on': step === 2 }">Confirmar</li>
          </ol>

          <p v-if="error" class="cm__error" role="alert">{{ error }}</p>

          <div class="cm__actions">
            <button type="button" class="cm__cancel" :disabled="loading" @click="emit('cancel')">Cancelar</button>
            <button type="button" class="cm__ok" :disabled="loading" @click="next">
              <BaseSpinner v-if="loading" :size="14" light />
              {{ step === 2 ? secondLabel : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.cm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px;
  background: rgba($primary-dark, 0.55);
  backdrop-filter: blur(3px);

  @media (min-width: 560px) {
    align-items: center;
  }
}

.cm {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 420px;
  padding: 24px 20px 18px;
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow-pop);
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: $primary;
    font-size: 1.3rem;
    margin-bottom: 12px;
  }

  h2 {
    font-size: 1.05rem;
    font-weight: 800;
  }

  &__subject {
    margin-top: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba($primary-dark, 0.05);
    font-family: $font-secondary;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text);
    word-break: break-word;
  }

  &__msg {
    margin-top: 10px;
    font-family: $font-secondary;
    font-size: 0.82rem;
    line-height: 1.55;
    color: var(--text-soft);
  }

  &__steps {
    display: flex;
    gap: 18px;
    list-style: none;
    padding: 0;
    margin: 14px 0 0;
    font-family: $font-secondary;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-faint);

    li {
      display: flex;
      align-items: center;
      gap: 6px;

      &::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--border-strong);
      }
      &.is-on { color: var(--text); &::before { background: $primary; } }
      &.is-done { color: $secondary; &::before { background: $secondary; } }
    }
  }

  &__error {
    margin-top: 12px;
    width: 100%;
    font-family: $font-secondary;
    font-size: 0.78rem;
    color: darken($alert-error, 8%);
    background: $alert-error-bg;
    border-radius: 8px;
    padding: 8px 12px;
  }

  &__actions {
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
    width: 100%;
    margin-top: 18px;

    @media (min-width: 560px) {
      flex-direction: row;
      justify-content: center;
    }
  }

  &__cancel,
  &__ok {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 9px;
    font-family: $font-principal;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, opacity 0.2s ease;

    @media (min-width: 560px) { flex: 1; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__cancel {
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--text);
  }

  &__ok {
    border: none;
    background: $primary;
    color: $white;
    &:hover:not(:disabled) { background: darken($primary, 6%); }
  }

  &.is-danger {
    .cm__icon { background: $alert-error-bg; color: $alert-error; }
    .cm__ok { background: $alert-error; &:hover:not(:disabled) { background: darken($alert-error, 8%); } }
  }

  &.is-step2 .cm__icon {
    animation: shake 0.4s ease;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.cm-enter-active,
.cm-leave-active {
  transition: opacity 0.2s ease;
  .cm { transition: transform 0.25s var(--ease-out); }
}
.cm-enter-from,
.cm-leave-to {
  opacity: 0;
  .cm { transform: translateY(14px) scale(0.98); }
}
</style>
