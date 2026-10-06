<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authService } from '@/services/auth.service'
import { normalizarEmail } from '@/utils/contrasena'
import AuthCard from '@/components/auth/AuthCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import type { ApiError } from '@/types'

const MENSAJE_GENERICO = 'Si el correo está registrado, te llegará un enlace para restablecer tu contraseña.'

const email = ref('')
const loading = ref(false)
const error = ref('')
/** Mensaje genérico tras enviar: no revela si la cuenta existe. */
const enviado = ref('')

async function submit() {
  if (loading.value) return
  error.value = ''
  const correo = normalizarEmail(email.value)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    error.value = 'Escribe un correo válido.'
    return
  }
  loading.value = true
  try {
    const res = await authService.olvideContrasena(correo)
    enviado.value = res.message || MENSAJE_GENERICO
  } catch (err) {
    const e = err as ApiError
    error.value =
      e?.status === 429
        ? e.message
        : 'No pudimos procesar la solicitud. Intenta de nuevo en un momento.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard
    titulo="¿Olvidaste tu contraseña?"
    subtitulo="Te enviaremos un enlace para crear una nueva."
  >
    <template v-if="enviado">
      <p class="auth-msg auth-msg--ok" role="status">
        <i class="fa-solid fa-envelope-circle-check"></i>
        {{ enviado }} Revisa también tu carpeta de spam. El enlace expira en 30 minutos.
      </p>
      <RouterLink to="/login" class="auth-submit">Volver al inicio de sesión</RouterLink>
    </template>

    <form v-else novalidate @submit.prevent="submit">
      <label class="auth-field">
        <span>Correo</span>
        <input
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="username"
          placeholder="tu@empresa.com"
          required
        />
      </label>

      <transition name="error">
        <p v-if="error" class="auth-msg auth-msg--error" role="alert">{{ error }}</p>
      </transition>

      <button class="auth-submit" type="submit" :disabled="loading">
        <BaseSpinner v-if="loading" :size="15" light />
        <span>{{ loading ? 'Enviando…' : 'Enviar enlace' }}</span>
      </button>

      <RouterLink to="/login" class="auth-link">Volver al inicio de sesión</RouterLink>
    </form>
  </AuthCard>
</template>

<style lang="scss" scoped>
.error-enter-active {
  transition: opacity 0.25s ease, transform 0.25s var(--ease-out);
}
.error-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
