<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useErpStore } from '@/stores/erp'
import { useUsersStore } from '@/stores/users'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import type { AppUser, UserRole } from '@/types/erp'
import type { ApiError } from '@/types'

const props = defineProps<{
  open: boolean
  /** Usuario existente (editar) o null (crear). */
  user: AppUser | null
  /** Preselección de vendedor al crear desde la vista Vendedores. */
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

const isEdit = computed(() => !!props.user)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    erp.fetchVendedores()
    error.value = ''
    password.value = ''
    email.value = props.user?.email || ''
    role.value = props.user?.role || 'vendedor'
    venCodigo.value = props.user?.venCodigo || props.presetVenCodigo || ''
    name.value = props.user?.name || ''
  },
)

/** Vendedores del ERP que aún no tienen cuenta (más el asignado al editar). */
const vendedoresDisponibles = computed(() =>
  erp.vendedores.data.filter(
    (v) =>
      !usersStore.venCodigosConCuenta.has(v.ven_codigo) ||
      v.ven_codigo === props.user?.venCodigo,
  ),
)

async function save() {
  if (saving.value) return
  error.value = ''
  saving.value = true
  try {
    if (isEdit.value && props.user) {
      await usersStore.update(props.user.id, {
        name: name.value || undefined,
        password: password.value || undefined,
        venCodigo: role.value === 'vendedor' ? venCodigo.value : undefined,
      })
    } else {
      await usersStore.create({
        email: email.value,
        password: password.value,
        role: role.value,
        venCodigo: role.value === 'vendedor' ? venCodigo.value : undefined,
        name: name.value || undefined,
      })
    }
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true">
          <h2>{{ isEdit ? 'Editar cuenta' : 'Nueva cuenta' }}</h2>
          <p class="modal__hint">
            Las cuentas se administran aquí. La asignación de clientes a cada vendedor
            viene del ERP y no se modifica en esta app.
          </p>

          <form @submit.prevent="save">
            <label>
              <span>Correo</span>
              <input v-model="email" type="email" required :disabled="isEdit" placeholder="persona@correo.com" />
            </label>

            <label v-if="!isEdit">
              <span>Rol</span>
              <select v-model="role">
                <option value="vendedor">Vendedor — ve solo sus clientes y su cartera</option>
                <option value="admin">Administrador — ve y gestiona todo</option>
              </select>
            </label>

            <label v-if="role === 'vendedor'">
              <span>Vendedor del ERP</span>
              <select v-model="venCodigo" required>
                <option value="" disabled>Selecciona…</option>
                <option v-for="v in vendedoresDisponibles" :key="v.ven_codigo" :value="v.ven_codigo">
                  {{ v.ven_nombre }} (código {{ v.ven_codigo }})
                </option>
              </select>
            </label>

            <label>
              <span>Nombre {{ role === 'vendedor' ? '(opcional, se toma del ERP)' : '' }}</span>
              <input v-model="name" type="text" :placeholder="role === 'vendedor' ? 'Automático desde el ERP' : 'Nombre completo'" />
            </label>

            <label>
              <span>{{ isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña' }}</span>
              <PasswordField v-model="password" />
            </label>

            <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

            <div class="modal__actions">
              <button type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
              <button type="submit" class="modal__save" :disabled="saving">
                <BaseSpinner v-if="saving" :size="14" light />
                {{ isEdit ? 'Guardar cambios' : 'Crear cuenta' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba($primary-dark, 0.5);
  backdrop-filter: blur(3px);
}

.modal {
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--surface);
  border-radius: 14px;
  padding: 26px 24px;
  box-shadow: var(--shadow-pop);

  h2 {
    font-size: 1.05rem;
    font-weight: 800;
  }

  &__hint {
    margin-top: 6px;
    font-family: $font-secondary;
    font-size: 0.75rem;
    color: var(--text-soft);
    line-height: 1.5;
  }

  form {
    margin-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 5px;

    span {
      font-family: $font-secondary;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-soft);
    }
  }

  input,
  select {
    padding: 10px 12px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    font-family: $font-secondary;
    font-size: 0.85rem;
    color: var(--text);
    background: var(--surface);

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.12);
    }

    &:disabled {
      background: rgba($primary-dark, 0.04);
      color: var(--text-faint);
    }
  }

  &__error {
    font-family: $font-secondary;
    font-size: 0.76rem;
    color: darken($alert-error, 8%);
    background: $alert-error-bg;
    border-radius: 8px;
    padding: 8px 12px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 6px;
  }

  &__cancel {
    padding: 9px 16px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    font-family: $font-principal;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
  }

  &__save {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border: none;
    border-radius: 8px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover:not(:disabled) {
      background: darken($primary, 6%);
    }

    &:disabled {
      opacity: 0.8;
    }
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.25s var(--ease-out);
  }
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    transform: translateY(12px) scale(0.98);
  }
}
</style>
