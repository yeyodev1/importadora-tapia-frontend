<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '@/services/auth.service'
import { useUserStore } from '@/stores/user'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import type { ApiError } from '@/types'

/**
 * Formulario "Cambiar mi correo" (Perfil y pantalla obligatoria del layout).
 * Pide el correo nuevo y la contraseña actual; al guardar actualiza la sesión
 * (correo, token nuevo y el pedido del admin) y emite `guardado`.
 */
const { textoBoton = 'Guardar correo' } = defineProps<{ textoBoton?: string }>()
const emit = defineEmits<{ guardado: [email: string] }>()

const userStore = useUserStore()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const exito = ref('')

async function guardar() {
  if (loading.value) return
  error.value = ''
  exito.value = ''
  const nuevo = email.value.trim().toLowerCase()
  if (!EMAIL_RE.test(nuevo)) {
    error.value = 'Escribe un correo válido, por ejemplo nombre@importadoratapia.com'
    return
  }
  if (nuevo === (userStore.email || '').toLowerCase()) {
    error.value = 'Ese ya es tu correo actual. Escribe uno distinto.'
    return
  }
  if (!password.value) {
    error.value = 'Escribe tu contraseña actual para confirmar que eres tú.'
    return
  }
  loading.value = true
  try {
    const res = await authService.cambiarCorreo(nuevo, password.value)
    userStore.correoCambiado(res.token, res.user)
    exito.value = `Desde ahora entra con ${res.user.email}`
    email.value = ''
    password.value = ''
    emit('guardado', res.user.email)
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo cambiar el correo. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="cc" novalidate @submit.prevent="guardar">
    <label class="cc__field">
      <span>Nuevo correo</span>
      <input
        v-model="email"
        type="email"
        inputmode="email"
        autocomplete="email"
        autocapitalize="off"
        spellcheck="false"
        placeholder="tu.nombre@correo.com"
        maxlength="254"
      />
    </label>

    <label class="cc__field">
      <span>Contraseña actual</span>
      <PasswordField v-model="password" />
    </label>

    <transition name="cc-msg">
      <p v-if="error" class="cc__msg cc__msg--error" role="alert">{{ error }}</p>
      <p v-else-if="exito" class="cc__msg cc__msg--ok" role="status">
        <i class="fa-solid fa-circle-check"></i> {{ exito }}
      </p>
    </transition>

    <button class="cc__submit" type="submit" :disabled="loading">
      <BaseSpinner v-if="loading" :size="15" light />
      <span>{{ loading ? 'Guardando…' : textoBoton }}</span>
    </button>
  </form>
</template>

<style lang="scss" scoped>
.cc {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;

    > span {
      font-family: $font-secondary;
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--text-soft);
    }

    input[type='email'] {
      width: 100%;
      min-height: 44px;
      padding: 11px 13px;
      border: 1px solid var(--border-strong);
      border-radius: 9px;
      font-family: $font-secondary;
      font-size: 0.88rem;
      color: var(--text);
      background: var(--surface);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;

      &:focus {
        outline: none;
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba($primary, 0.14);
      }
    }
  }

  &__msg {
    font-family: $font-secondary;
    font-size: 0.8rem;
    line-height: 1.5;
    border-radius: 8px;
    padding: 9px 12px;
    text-align: left;
    word-break: break-word;

    &--error {
      color: darken($alert-error, 8%);
      background: $alert-error-bg;
    }

    &--ok {
      color: darken($secondary, 14%);
      background: rgba($secondary, 0.12);
    }
  }

  &__submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 18px;
    border: none;
    border-radius: 10px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, opacity 0.2s ease;

    &:hover:not(:disabled) {
      background: darken($primary, 6%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.cc-msg-enter-active {
  transition: opacity 0.25s ease, transform 0.25s var(--ease-out);
}
.cc-msg-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
