<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useErpStore } from '@/stores/erp'
import { useUsersStore } from '@/stores/users'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import RolePicker from './RolePicker.vue'
import VendedorPicker from './VendedorPicker.vue'
import type { AppUser, UserRole } from '@/types/erp'
import type { ApiError } from '@/types'

const props = defineProps<{
  open: boolean
  /** Usuario existente (editar) o null (crear). */
  user: AppUser | null
  /** Preselección de vendedor al crear desde la lista de vendedores sin cuenta. */
  presetVenCodigo?: string | null
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const erp = useErpStore()
const usersStore = useUsersStore()

const email = ref('')
const password = ref('')
const role = ref<UserRole>('vendedor')
const venCodigo = ref('')
const name = ref('')
const saving = ref(false)
const error = ref('')
/** Al crear varias seguidas: el modal no se cierra y va listando las creadas. */
const crearOtra = ref(false)
const creadas = ref<{ email: string; name: string; emailSent: boolean }[]>([])

const isEdit = computed(() => !!props.user)

function resetForm(keepRole = false) {
  error.value = ''
  password.value = ''
  email.value = props.user?.email || ''
  if (!keepRole) role.value = props.user?.role || 'vendedor'
  venCodigo.value = props.user?.venCodigo || props.presetVenCodigo || ''
  name.value = props.user?.name || ''
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    erp.fetchVendedores()
    creadas.value = []
    crearOtra.value = false
    resetForm()
  },
)

/** Vendedores del ERP que aún no tienen cuenta (más el asignado al editar). */
const vendedoresDisponibles = computed(() =>
  erp.vendedores.data.filter(
    (v) => !usersStore.venCodigosConCuenta.has(v.ven_codigo) || v.ven_codigo === props.user?.venCodigo,
  ),
)

const vendedorElegido = computed(
  () => erp.vendedores.data.find((v) => v.ven_codigo === venCodigo.value) || null,
)

/** Al elegir vendedor, sugerir un correo si aún no se escribió ninguno. */
watch(vendedorElegido, (v) => {
  if (!v || email.value || isEdit.value) return
  const partes = v.ven_nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  const base = partes.slice(-2).join('.') || 'vendedor'
  email.value = `${base}@importadoratapia.com`
})

function generarClave() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(10)
  crypto.getRandomValues(arr)
  let out = ''
  for (const n of arr) out += chars[n % chars.length]
  password.value = `${out.slice(0, 5)}-${out.slice(5)}`
}

const puedeGuardar = computed(() => {
  if (saving.value) return false
  if (!email.value.trim()) return false
  if (isEdit.value) return !password.value || password.value.length >= 6
  if (password.value.length < 6) return false
  return role.value === 'vendedor' ? !!venCodigo.value : !!name.value.trim()
})

async function save() {
  if (!puedeGuardar.value) return
  error.value = ''
  saving.value = true
  try {
    if (isEdit.value && props.user) {
      const nuevoCorreo = email.value.trim().toLowerCase()
      await usersStore.update(props.user.id, {
        email: nuevoCorreo && nuevoCorreo !== props.user.email ? nuevoCorreo : undefined,
        name: name.value || undefined,
        password: password.value || undefined,
        venCodigo: role.value === 'vendedor' ? venCodigo.value : undefined,
      })
      emit('saved')
      emit('close')
      return
    }
    const { user, emailSent } = await usersStore.create({
      email: email.value.trim(),
      password: password.value,
      role: role.value,
      venCodigo: role.value === 'vendedor' ? venCodigo.value : undefined,
      name: name.value || undefined,
    })
    creadas.value.unshift({ email: user.email, name: user.name, emailSent })
    emit('saved')
    if (!crearOtra.value) {
      emit('close')
      return
    }
    resetForm(true)
    // Pasar al siguiente vendedor sin cuenta para ir rápido.
    if (role.value === 'vendedor') venCodigo.value = vendedoresDisponibles.value[0]?.ven_codigo || ''
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}

const pasoDatos = computed(() => (isEdit.value ? 'Datos' : role.value === 'vendedor' ? '3. Datos de acceso' : '2. Datos de acceso'))
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true">
          <header class="modal__head">
            <div>
              <h2>{{ isEdit ? 'Editar cuenta' : 'Nueva cuenta de acceso' }}</h2>
              <p class="modal__hint">
                <template v-if="isEdit">Cambia el correo, el nombre, la contraseña o el vendedor vinculado.</template>
                <template v-else>La persona recibirá un correo con su usuario y contraseña.</template>
              </p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <ul v-if="creadas.length" class="creadas" aria-live="polite">
            <li v-for="c in creadas" :key="c.email">
              <i class="fa-solid fa-circle-check"></i>
              <span><b>{{ c.name }}</b> · {{ c.email }}</span>
              <small>{{ c.emailSent ? 'correo enviado' : 'sin correo: pásale la clave a mano' }}</small>
            </li>
          </ul>

          <form @submit.prevent="save">
            <fieldset v-if="!isEdit">
              <legend>1. ¿Qué rol tendrá?</legend>
              <RolePicker v-model="role" />
            </fieldset>

            <fieldset v-if="role === 'vendedor'">
              <legend>{{ isEdit ? 'Vendedor del ERP vinculado' : '2. ¿Qué vendedor del ERP es?' }}</legend>
              <VendedorPicker
                v-model="venCodigo"
                :vendedores="vendedoresDisponibles"
                :loading="erp.vendedores.loading"
                :error="erp.vendedores.error"
                @retry="erp.fetchVendedores(true)"
              />
            </fieldset>

            <fieldset>
              <legend>{{ pasoDatos }}</legend>

              <label class="field">
                <span>Correo (será su usuario)</span>
                <input v-model="email" type="email" required placeholder="persona@importadoratapia.com" autocomplete="off" />
              </label>

              <label class="field">
                <span>
                  Nombre
                  <em v-if="role === 'vendedor' && !isEdit"> · opcional, se toma del ERP: {{ vendedorElegido?.ven_nombre || '—' }}</em>
                </span>
                <input v-model="name" type="text" :placeholder="role === 'vendedor' ? 'Automático desde el ERP' : 'Nombre completo'" />
              </label>

              <label class="field">
                <span>{{ isEdit ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña (mínimo 6 caracteres)' }}</span>
                <div class="pwd">
                  <PasswordField v-model="password" />
                  <button type="button" class="pwd__gen" @click="generarClave">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Generar clave
                  </button>
                </div>
              </label>
            </fieldset>

            <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

            <div class="modal__actions">
              <label v-if="!isEdit" class="otra">
                <input v-model="crearOtra" type="checkbox" />
                <span>Crear otra cuenta al terminar</span>
              </label>
              <div class="modal__btns">
                <button type="button" class="modal__cancel" @click="emit('close')">
                  {{ creadas.length ? 'Listo' : 'Cancelar' }}
                </button>
                <button type="submit" class="modal__save" :disabled="!puedeGuardar">
                  <BaseSpinner v-if="saving" :size="14" light />
                  {{ isEdit ? 'Guardar cambios' : 'Crear cuenta y enviar correo' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use './form-modal';
</style>
