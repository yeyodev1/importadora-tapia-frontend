<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useUserStore } from '@/stores/user'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import UserFormModal from './equipo/UserFormModal.vue'
import UserCard from './equipo/UserCard.vue'
import type { AppUser } from '@/types/erp'
import type { ApiError } from '@/types'

const usersStore = useUsersStore()
const sessionStore = useUserStore()

onMounted(() => usersStore.fetch())

const modalOpen = ref(false)
const editing = ref<AppUser | null>(null)
const deleteError = ref('')

const admins = computed(() => usersStore.data.filter((u) => u.role === 'admin'))
const vendedores = computed(() => usersStore.data.filter((u) => u.role === 'vendedor'))

function openCreate() {
  editing.value = null
  modalOpen.value = true
}

function openEdit(user: AppUser) {
  editing.value = user
  modalOpen.value = true
}

async function removeUser(user: AppUser) {
  deleteError.value = ''
  if (!window.confirm(`¿Eliminar la cuenta de ${user.name}? Perderá el acceso a la app.`)) return
  try {
    await usersStore.remove(user.id)
  } catch (err) {
    deleteError.value = (err as ApiError)?.message || 'No se pudo eliminar'
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Equipo"
      subtitle="Cuentas de acceso a la app: quién entra y con qué rol"
      source="local"
      :count="usersStore.fetchedAt ? usersStore.data.length : null"
      :refreshing="usersStore.loading && !!usersStore.fetchedAt"
      @refresh="usersStore.fetch(true)"
    >
      <template #actions>
        <button class="new-btn" type="button" @click="openCreate">+ Nueva cuenta</button>
      </template>
    </PageHeader>

    <p class="note">
      Aquí se crean las <b>cuentas de acceso</b> (correo y contraseña). La lista de vendedores y
      la asignación de sus clientes vienen del <b>ERP de Tapia (solo lectura)</b>: para cambiar
      clientes de un vendedor se hace en ese sistema, no aquí.
    </p>

    <p v-if="deleteError" class="delete-error" role="alert">{{ deleteError }}</p>

    <div v-if="usersStore.loading && !usersStore.fetchedAt" class="grid">
      <div v-for="i in 4" :key="i" class="card card--skeleton stagger-item" :style="{ '--i': i }">
        <span class="skeleton" style="width: 40px; height: 40px; border-radius: 50%" />
        <span class="skeleton" style="width: 65%; height: 13px" />
        <span class="skeleton" style="width: 45%; height: 11px" />
      </div>
    </div>

    <EmptyState
      v-else-if="usersStore.error"
      tone="error"
      title="No se pudo cargar"
      :message="usersStore.error"
      @retry="usersStore.fetch(true)"
    />

    <template v-else>
      <section v-for="grupo in [
          { titulo: 'Administradores', lista: admins },
          { titulo: 'Vendedores', lista: vendedores },
        ]" :key="grupo.titulo" class="grupo">
        <h2>{{ grupo.titulo }} <small>{{ grupo.lista.length }}</small></h2>

        <div class="grid">
          <UserCard
            v-for="(u, i) in grupo.lista"
            :key="u.id"
            class="stagger-item"
            :style="{ '--i': i }"
            :user="u"
            :can-delete="u.id !== sessionStore.id"
            @edit="openEdit(u)"
            @remove="removeUser(u)"
          />
        </div>
      </section>
    </template>

    <UserFormModal :open="modalOpen" :user="editing" @close="modalOpen = false" />
  </div>
</template>

<style lang="scss" scoped>
.new-btn {
  padding: 9px 16px;
  border: none;
  border-radius: 8px;
  background: $primary;
  color: $white;
  font-family: $font-principal;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;

  &:hover {
    background: darken($primary, 6%);
    transform: translateY(-1px);
  }
}

.note {
  font-family: $font-secondary;
  font-size: 0.78rem;
  line-height: 1.55;
  color: var(--text-soft);
  background: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.15);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;

  b {
    color: var(--text);
  }
}

.delete-error {
  font-family: $font-secondary;
  font-size: 0.78rem;
  color: darken($alert-error, 8%);
  background: $alert-error-bg;
  border-radius: 8px;
  padding: 9px 12px;
  margin-bottom: 14px;
}

.grupo {
  margin-bottom: 26px;

  h2 {
    font-size: 0.92rem;
    font-weight: 800;
    margin-bottom: 12px;

    small {
      font-family: $font-secondary;
      font-size: 0.72rem;
      font-weight: 600;
      color: $primary;
      background: var(--accent-soft);
      border-radius: 999px;
      padding: 2px 8px;
      margin-left: 6px;
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}

.card--skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
}
</style>
