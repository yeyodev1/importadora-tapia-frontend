<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { validarContrasena } from '@/utils/contrasena'
import AuthCard from '@/components/auth/AuthCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import type { ApiError } from '@/types'

const route = useRoute()
const router = useRouter()

/** Token del enlace del correo; se guarda en memoria y se quita de la URL. */
const token = ref('')
const listo = ref(false)
const password = ref('')
const confirmacion = ref('')
const loading = ref(false)
const error = ref('')
const enlaceInvalido = ref(false)

const tokenValido = computed(() => /^[a-f0-9]{64}$/.test(token.value))

onMounted(() => {
  const q = route.query.token
  token.value = String((Array.isArray(q) ? q[0] : q) ?? '').trim()
  // Se reemplaza la entrada del historial para que el token no quede guardado.
  if (route.query.token !== undefined) router.replace({ path: route.path, query: {} })
  listo.value = true
})

async function submit() {
  if (loading.value) return
  error.value = ''
  const invalida = validarContrasena(password.value)
  if (invalida) {
    error.value = invalida
    return
  }
  if (password.value !== confirmacion.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }
  loading.value = true
  try {
    await authService.restablecerContrasena(token.value, password.value)
    token.value = ''
    router.replace({ path: '/login', query: { restablecida: '1' } })
  } catch (err) {
    const e = err as ApiError
    if (e?.status === 400 && /enlace/i.test(e.message)) enlaceInvalido.value = true
    else error.value = e?.message || 'No se pudo cambiar la contraseña. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard titulo="Crea una nueva contraseña" subtitulo="Mínimo 8 caracteres, con letras y números.">
    <template v-if="listo && (!tokenValido || enlaceInvalido)">
      <p class="auth-msg auth-msg--error" role="alert">
        El enlace no es válido o ya expiró. Pide uno nuevo: cada enlace dura 30 minutos y sirve una sola vez.
      </p>
      <RouterLink to="/olvide-contrasena" class="auth-submit">Pedir un enlace nuevo</RouterLink>
      <RouterLink to="/login" class="auth-link">Volver al inicio de sesión</RouterLink>
    </template>

    <form v-else-if="listo" novalidate @submit.prevent="submit">
      <label class="auth-field">
        <span>Nueva contraseña</span>
        <PasswordField v-model="password" autocomplete="new-password" />
      </label>

      <label class="auth-field">
        <span>Confirma la contraseña</span>
        <PasswordField v-model="confirmacion" autocomplete="new-password" />
      </label>

      <transition name="error">
        <p v-if="error" class="auth-msg auth-msg--error" role="alert">{{ error }}</p>
      </transition>

      <button class="auth-submit" type="submit" :disabled="loading">
        <BaseSpinner v-if="loading" :size="15" light />
        <span>{{ loading ? 'Guardando…' : 'Guardar contraseña' }}</span>
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
