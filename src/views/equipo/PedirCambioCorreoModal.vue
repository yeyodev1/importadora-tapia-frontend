<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useUsersStore } from '@/stores/users'
import type { AppUser } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Confirmación para pedir (o cancelar el pedido) que una persona ponga su
 * propio correo. Pedirlo bloquea su app hasta que lo cambie: se confirma dos veces.
 */
const props = defineProps<{ user: AppUser | null }>()
const emit = defineEmits<{ close: [] }>()

const usersStore = useUsersStore()
const guardando = ref(false)
const error = ref('')

/** true = va a pedir el cambio; false = va a cancelar un pedido vigente. */
const pedir = computed(() => !props.user?.debeCambiarCorreo)

watch(
  () => props.user,
  () => (error.value = ''),
)

async function confirmar() {
  if (!props.user) return
  guardando.value = true
  error.value = ''
  try {
    await usersStore.update(props.user.id, { debeCambiarCorreo: pedir.value })
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo guardar. Intenta de nuevo.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <ConfirmModal
    :open="!!user"
    :title="pedir ? 'Pedir cambio de correo' : 'Cancelar el pedido'"
    :subject="user ? `${user.name} · ${user.email}` : ''"
    :message="
      pedir
        ? 'La próxima vez que abra el CRM verá una pantalla que no puede cerrar hasta poner su correo personal (con su contraseña actual). Mientras tanto no podrá usar la app.'
        : 'Ya no se le pedirá cambiar su correo y podrá seguir entrando con el actual.'
    "
    :confirm-label="pedir ? 'Continuar' : 'Sí, cancelar pedido'"
    :second-message="
      pedir
        ? 'Su app quedará bloqueada hasta que cambie el correo. Avísale para que tenga a mano su correo y su contraseña.'
        : ''
    "
    second-label="Sí, pedir el cambio"
    :loading="guardando"
    :error="error"
    @cancel="!guardando && emit('close')"
    @confirm="confirmar"
  />
</template>
