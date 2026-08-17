<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { initials } from '@/utils/format'

const router = useRouter()
const userStore = useUserStore()

function logout() {
  userStore.clear()
  router.push('/login')
}
</script>

<template>
  <footer class="user-footer">
    <div class="user-footer__user">
      <span class="user-footer__avatar">{{ initials(userStore.name || userStore.email) }}</span>
      <div class="user-footer__info">
        <strong>{{ userStore.name || 'Usuario' }}</strong>
        <small>{{ userStore.isAdmin ? 'Administrador' : 'Vendedor' }}</small>
      </div>
    </div>
    <button class="user-footer__logout" type="button" title="Cerrar sesión" @click="logout">
      <i class="fa-solid fa-right-from-bracket"></i>
    </button>
  </footer>
</template>

<style lang="scss" scoped>
.user-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-top: 1px solid rgba($white, 0.08);

  &__user {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  &__avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
    background: rgba($secondary, 0.2);
    color: $secondary;
    font-size: 0.72rem;
    font-weight: 800;
  }

  &__info {
    min-width: 0;

    strong {
      display: block;
      font-size: 0.78rem;
      color: $white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    small {
      display: block;
      font-family: $font-secondary;
      font-size: 0.66rem;
      color: rgba($white, 0.4);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__logout {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: rgba($white, 0.5);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;

    i {
      font-size: 0.9rem;
    }

    &:hover {
      background: rgba($alert-error, 0.18);
      color: lighten($alert-error, 18%);
    }
  }
}
</style>
