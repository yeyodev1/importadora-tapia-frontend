<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { erpService } from '@/services/erp.service'
import { useUserStore } from '@/stores/user'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import type { ApiError } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const shake = ref(false)

async function submit() {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try {
    const res = await erpService.login(email.value, password.value)
    userStore.login(res.token, res.user)
    router.push('/')
  } catch (err) {
    const e = err as ApiError
    error.value =
      e?.status === 401
        ? 'Correo o contraseña incorrectos.'
        : e?.message || 'No se pudo iniciar sesión. Intenta de nuevo.'
    shake.value = false
    requestAnimationFrame(() => (shake.value = true))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="login__panel" :class="{ 'is-shaking': shake }" @animationend="shake = false">
      <span class="login__logo">IT</span>
      <h1>Importadora Tapia <em>CRM</em></h1>
      <p class="login__subtitle">Panel comercial · vendedores y administración</p>

      <form novalidate @submit.prevent="submit">
        <label class="login__field">
          <span>Correo</span>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            placeholder="tu@empresa.com"
            required
          />
        </label>

        <label class="login__field">
          <span>Contraseña</span>
          <PasswordField v-model="password" />
        </label>

        <transition name="error">
          <p v-if="error" class="login__error" role="alert">{{ error }}</p>
        </transition>

        <button class="login__submit" type="submit" :disabled="loading">
          <BaseSpinner v-if="loading" :size="15" light />
          <span>{{ loading ? 'Ingresando…' : 'Ingresar' }}</span>
        </button>
      </form>
    </div>

    <p class="login__foot">Datos en vivo del ERP · conexión cifrada</p>
  </div>
</template>

<style lang="scss" scoped>
.login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 24px;
  background:
    radial-gradient(90% 70% at 85% -10%, rgba($primary, 0.35), transparent 55%),
    radial-gradient(70% 60% at 0% 100%, rgba($secondary, 0.16), transparent 55%),
    $primary-dark;

  &__panel {
    width: 100%;
    max-width: 380px;
    background: var(--surface);
    border-radius: 16px;
    padding: 34px 30px 30px;
    box-shadow: 0 24px 60px rgba(black, 0.35);
    animation: panel-in 0.5s var(--ease-out);

    &.is-shaking {
      animation: shake 0.4s ease;
    }

    h1 {
      margin-top: 16px;
      font-size: 1.3rem;
      font-weight: 800;
      letter-spacing: -0.02em;

      em {
        font-style: normal;
        color: $primary;
      }
    }
  }

  &__logo {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, $primary, darken($primary, 12%));
    color: $white;
    font-weight: 800;
    box-shadow: 0 6px 18px rgba($primary, 0.4);
  }

  &__subtitle {
    margin-top: 3px;
    font-family: $font-secondary;
    font-size: 0.8rem;
    color: var(--text-soft);
  }

  form {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    span {
      font-family: $font-secondary;
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--text-soft);
    }

    input {
      width: 100%;
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

  &__error {
    font-family: $font-secondary;
    font-size: 0.78rem;
    color: darken($alert-error, 8%);
    background: $alert-error-bg;
    border-radius: 8px;
    padding: 9px 12px;
  }

  &__submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 12px;
    border: none;
    border-radius: 9px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;

    &:hover:not(:disabled) {
      background: darken($primary, 6%);
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba($primary, 0.35);
    }

    &:disabled {
      opacity: 0.85;
      cursor: default;
    }
  }

  &__foot {
    font-family: $font-secondary;
    font-size: 0.72rem;
    color: rgba($white, 0.45);
  }
}

.error-enter-active {
  transition: opacity 0.25s ease, transform 0.25s var(--ease-out);
}
.error-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes shake {
  20% { transform: translateX(-7px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}
</style>
