<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { initials } from '@/utils/format'
import type { AppUser } from '@/types/erp'

defineProps<{ user: AppUser; canDelete: boolean }>()
defineEmits<{ edit: []; remove: [] }>()
</script>

<template>
  <article class="card">
    <div class="card__head">
      <span class="card__avatar" :class="{ 'is-admin': user.role === 'admin' }">
        {{ initials(user.name) }}
      </span>
      <div class="card__who">
        <strong>{{ user.name }}</strong>
        <small>{{ user.email }}</small>
      </div>
      <BaseBadge :tone="user.role === 'admin' ? 'info' : 'success'">
        {{ user.role === 'admin' ? 'Admin' : 'Vendedor' }}
      </BaseBadge>
    </div>

    <p v-if="user.venCodigo" class="card__erp">
      Vinculado al vendedor <b>código {{ user.venCodigo }}</b> del ERP
    </p>

    <div class="card__actions">
      <button type="button" @click="$emit('edit')">Editar / clave</button>
      <button v-if="canDelete" type="button" class="is-danger" @click="$emit('remove')">
        Eliminar
      </button>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 16px;
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-pop);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__avatar {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    flex-shrink: 0;
    background: rgba($secondary, 0.14);
    color: darken($secondary, 10%);
    font-size: 0.72rem;
    font-weight: 800;

    &.is-admin {
      background: var(--accent-soft);
      color: $primary;
    }
  }

  &__who {
    flex: 1;
    min-width: 0;

    strong {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    small {
      display: block;
      font-family: $font-secondary;
      font-size: 0.7rem;
      color: var(--text-faint);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__erp {
    margin-top: 10px;
    font-family: $font-secondary;
    font-size: 0.7rem;
    color: var(--text-faint);

    b {
      color: var(--text-soft);
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);

    button {
      flex: 1;
      padding: 8px 0;
      border: 1px solid var(--border-strong);
      border-radius: 7px;
      background: var(--surface);
      font-family: $font-principal;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;

      &:hover {
        border-color: $primary;
        color: $primary;
      }

      &.is-danger:hover {
        border-color: $alert-error;
        color: $alert-error;
        background: $alert-error-bg;
      }
    }
  }
}
</style>
