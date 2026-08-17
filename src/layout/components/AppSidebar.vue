<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarUser from './SidebarUser.vue'
import { useUserStore } from '@/stores/user'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const userStore = useUserStore()

interface NavItem {
  to: string
  label: string
  icon: string
  adminOnly?: boolean
}

// Clases FontAwesome (CDN cargado en index.html)
const icons: Record<string, string> = {
  home: 'fa-house',
  users: 'fa-users',
  briefcase: 'fa-user-tie',
  box: 'fa-boxes-stacked',
  file: 'fa-file-invoice-dollar',
  chart: 'fa-chart-column',
  cash: 'fa-money-bill-wave',
  key: 'fa-key',
  user: 'fa-circle-user',
}

const allSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Principal',
    items: [{ to: '/', label: 'Resumen', icon: 'home' }],
  },
  {
    title: 'Comercial',
    items: [
      { to: '/clientes', label: 'Clientes', icon: 'users' },
      { to: '/vendedores', label: 'Vendedores', icon: 'briefcase', adminOnly: true },
    ],
  },
  {
    title: 'Operación',
    items: [{ to: '/inventario', label: 'Inventario', icon: 'box' }],
  },
  {
    title: 'Finanzas',
    items: [
      { to: '/cartera/facturas', label: 'Cartera · Facturas', icon: 'file' },
      { to: '/cartera/consolidada', label: 'Cartera · Consolidada', icon: 'chart' },
      { to: '/cobros', label: 'Cobros', icon: 'cash' },
    ],
  },
  {
    title: 'Cuenta',
    items: [
      { to: '/me', label: 'Mi perfil', icon: 'user' },
      { to: '/equipo', label: 'Equipo', icon: 'key', adminOnly: true },
    ],
  },
]

const sections = computed(() =>
  allSections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.adminOnly || userStore.isAdmin),
    }))
    .filter((s) => s.items.length),
)

</script>

<template>
  <div v-if="open" class="sidebar-backdrop" @click="emit('close')" />

  <aside class="sidebar" :class="{ 'is-open': open }">
    <div class="sidebar__brand">
      <span class="sidebar__logo">IT</span>
      <div>
        <strong>Importadora Tapia</strong>
        <small>CRM Comercial</small>
      </div>
    </div>

    <nav class="sidebar__nav">
      <div v-for="section in sections" :key="section.title" class="sidebar__section">
        <p class="sidebar__section-title">{{ section.title }}</p>
        <RouterLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="sidebar__link"
          :class="{ 'is-active': route.path === item.to }"
          @click="emit('close')"
        >
          <i class="fa-solid" :class="icons[item.icon]"></i>
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <SidebarUser />
  </aside>
</template>

<style lang="scss" scoped>
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba($primary-dark, 0.45);
  backdrop-filter: blur(2px);

  @media (min-width: 961px) {
    display: none;
  }
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(120% 60% at 0% 0%, rgba($primary, 0.16), transparent 60%),
    $primary-dark;
  color: rgba($white, 0.82);
  transform: translateX(-100%);
  transition: transform 0.3s var(--ease-out);

  @media (min-width: 961px) {
    transform: none;
  }

  &.is-open {
    transform: none;
    box-shadow: var(--shadow-pop);
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 22px 20px;

    strong {
      display: block;
      font-size: 0.95rem;
      font-weight: 800;
      color: $white;
      letter-spacing: -0.01em;
    }

    small {
      font-family: $font-secondary;
      font-size: 0.68rem;
      color: rgba($white, 0.45);
    }
  }

  &__logo {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, $primary, darken($primary, 12%));
    color: $white;
    font-weight: 800;
    font-size: 0.9rem;
    letter-spacing: 0.02em;
    box-shadow: 0 4px 14px rgba($primary, 0.35);
  }

  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: 6px 12px 20px;
  }

  &__section {
    margin-top: 18px;
  }

  &__section-title {
    padding: 0 10px 6px;
    font-family: $font-secondary;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba($white, 0.32);
  }

  &__link {
    position: relative;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;

    @media (max-width: 960px) {
      padding: 13px 12px;
    }
    margin-bottom: 2px;
    border-radius: 9px;
    font-size: 0.84rem;
    font-weight: 600;
    color: rgba($white, 0.68);
    text-decoration: none;
    transition: background 0.2s ease, color 0.2s ease, padding-left 0.2s var(--ease-out);

    i {
      width: 18px;
      font-size: 0.95rem;
      text-align: center;
      flex-shrink: 0;
      opacity: 0.85;
    }

    &:hover {
      color: $white;
      background: rgba($white, 0.06);
      padding-left: 15px;
    }

    &.is-active {
      color: $white;
      background: linear-gradient(90deg, rgba($primary, 0.28), rgba($primary, 0.1));

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 20%;
        bottom: 20%;
        width: 3px;
        border-radius: 3px;
        background: $primary;
        box-shadow: 0 0 10px rgba($primary, 0.8);
      }
    }
  }

}
</style>
