<script setup lang="ts">
import type { UserRole } from '@/types/erp'

/** Elección de rol como tarjetas (sin <select> nativo). */
const model = defineModel<UserRole>({ required: true })

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  {
    value: 'vendedor',
    label: 'Vendedor',
    icon: 'fa-user-tie',
    desc: 'Ve solo sus clientes, su cartera, pedidos y visitas. Se vincula a un vendedor del ERP.',
  },
  {
    value: 'bodega',
    label: 'Bodega',
    icon: 'fa-truck-ramp-box',
    desc: 'Solo ve los pedidos para despachar y el inventario. Marca la salida con foto.',
  },
  {
    value: 'admin',
    label: 'Administrador',
    icon: 'fa-user-shield',
    desc: 'Ve y gestiona todo: cartera completa, pedidos, cobros y usuarios.',
  },
]
</script>

<template>
  <div class="roles">
    <button
      v-for="r in ROLES"
      :key="r.value"
      type="button"
      class="role"
      :class="{ 'is-active': model === r.value }"
      :aria-pressed="model === r.value"
      @click="model = r.value"
    >
      <span class="role__icon"><i class="fa-solid" :class="r.icon"></i></span>
      <span class="role__text">
        <strong>{{ r.label }}</strong>
        <small>{{ r.desc }}</small>
      </span>
      <i v-if="model === r.value" class="fa-solid fa-circle-check role__check"></i>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.roles {
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 560px) {
    flex-direction: row;
    flex-wrap: wrap;
    > * { flex: 1 1 150px; }
  }
}

.role {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 12px;
  border: 1.5px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: rgba($primary-dark, 0.05);
    color: var(--text-faint);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    flex: 1;

    strong { font-size: 0.86rem; font-weight: 800; color: var(--text); }
    small { font-family: $font-secondary; font-size: 0.7rem; line-height: 1.4; color: var(--text-soft); }
  }

  &__check { color: $primary; margin-top: 2px; }

  &:hover { border-color: $primary; }

  &.is-active {
    border-color: $primary;
    background: var(--accent-soft);
    .role__icon { background: rgba($primary, 0.15); color: $primary; }
  }
}
</style>
