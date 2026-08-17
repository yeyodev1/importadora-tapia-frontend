<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useErpStore } from '@/stores/erp'
import { useUsersStore } from '@/stores/users'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { initials, formatInt } from '@/utils/format'

const erp = useErpStore()
const usersStore = useUsersStore()

onMounted(() => {
  erp.fetchVendedores()
  erp.fetchClientes()
  usersStore.fetch()
})

const clientesPorVendedor = computed(() => {
  const map = new Map<string, number>()
  for (const c of erp.clientes.data) {
    map.set(c.ven_codigo, (map.get(c.ven_codigo) || 0) + 1)
  }
  return map
})

const loading = computed(() => erp.vendedores.loading && !erp.vendedores.fetchedAt)
const count = computed(() => (erp.vendedores.fetchedAt ? erp.vendedores.data.length : null))
</script>

<template>
  <div>
    <PageHeader
      title="Vendedores"
      subtitle="Equipo comercial y clientes asignados (la asignación se administra en el ERP)"
      source="erp"
      :count="count"
      :refreshing="erp.vendedores.loading && !!erp.vendedores.fetchedAt"
      @refresh="erp.fetchVendedores(true)"
    >
      <template #actions>
        <RouterLink to="/equipo" class="link-equipo">Gestionar accesos →</RouterLink>
      </template>
    </PageHeader>

    <div v-if="loading" class="grid">
      <div v-for="i in 6" :key="i" class="card card--skeleton stagger-item" :style="{ '--i': i }">
        <span class="skeleton" style="width: 44px; height: 44px; border-radius: 50%" />
        <span class="skeleton" style="width: 70%; height: 14px" />
        <span class="skeleton" style="width: 40%; height: 11px" />
      </div>
    </div>

    <EmptyState
      v-else-if="erp.vendedores.error"
      tone="error"
      title="No se pudo cargar"
      :message="erp.vendedores.error"
      @retry="erp.fetchVendedores(true)"
    />

    <div v-else class="grid">
      <article
        v-for="(v, i) in erp.vendedores.data"
        :key="v.ven_codigo"
        class="card stagger-item"
        :style="{ '--i': i }"
      >
        <span class="card__avatar">{{ initials(v.ven_nombre) }}</span>
        <h3>{{ v.ven_nombre }}</h3>
        <p class="card__code">Código {{ v.ven_codigo }}</p>
        <BaseBadge
          v-if="usersStore.fetchedAt"
          :tone="usersStore.venCodigosConCuenta.has(v.ven_codigo) ? 'success' : 'neutral'"
        >
          {{ usersStore.venCodigosConCuenta.has(v.ven_codigo) ? 'Con acceso a la app' : 'Sin cuenta aún' }}
        </BaseBadge>
        <p class="card__count">
          <strong>{{ formatInt(clientesPorVendedor.get(v.ven_codigo) || 0) }}</strong>
          clientes asignados
        </p>
      </article>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.link-equipo {
  font-family: $font-secondary;
  font-size: 0.78rem;
  font-weight: 700;
  color: $primary;
  text-decoration: none;
  padding: 8px 14px;
  border: 1px solid rgba($primary, 0.35);
  border-radius: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: var(--accent-soft);
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 22px 20px;
  text-align: center;
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-pop);
    border-color: rgba($primary, 0.3);
  }

  &--skeleton {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  &__avatar {
    display: inline-grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba($primary, 0.16), rgba($secondary, 0.16));
    color: $primary;
    font-weight: 800;
    font-size: 0.85rem;
    margin-bottom: 10px;
  }

  h3 {
    font-size: 0.86rem;
    font-weight: 700;
    line-height: 1.35;
  }

  &__code {
    margin-top: 3px;
    font-family: $font-secondary;
    font-size: 0.7rem;
    color: var(--text-faint);
  }

  &__count {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    font-family: $font-secondary;
    font-size: 0.74rem;
    color: var(--text-soft);

    strong {
      color: $primary;
      font-size: 0.95rem;
      font-weight: 800;
      margin-right: 4px;
    }
  }
}
</style>
