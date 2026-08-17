<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useErpStore } from '@/stores/erp'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTable, { type Column } from '@/components/ui/DataTable.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { initials } from '@/utils/format'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import type { Cliente } from '@/types/erp'

const erp = useErpStore()
const userStore = useUserStore()
const router = useRouter()
const isVendedor = computed(() => !userStore.isAdmin)

function verCliente(c: Cliente) {
  router.push(`/clientes/${c.per_codigo}`)
}

onMounted(() => {
  erp.fetchClientes()
  erp.fetchCarteraFacturas()
})

/** Máximo de facturas abiertas antes del bloqueo de facturación (política actual). */
const MAX_FACTURAS = 6

interface CreditoInfo {
  abiertas: number
  vencidas: number
}

const creditoPorCliente = computed(() => {
  const map = new Map<string, CreditoInfo>()
  for (const f of erp.carteraFacturas.data) {
    if (Number(f.saldo_pendiente) <= 0) continue
    const info = map.get(f.per_nombre) || { abiertas: 0, vencidas: 0 }
    info.abiertas++
    if (f.estado_factura === 'VENCIDO') info.vencidas++
    map.set(f.per_nombre, info)
  }
  return map
})

function creditoTone(nombre: string): 'success' | 'warning' | 'danger' {
  const c = creditoPorCliente.value.get(nombre)
  if (!c) return 'success'
  if (c.vencidas > 0 || c.abiertas >= MAX_FACTURAS) return 'danger'
  if (c.abiertas >= MAX_FACTURAS - 1) return 'warning'
  return 'success'
}

function creditoLabel(nombre: string): string {
  const c = creditoPorCliente.value.get(nombre)
  if (!c) return 'Al día'
  if (c.vencidas > 0) return `${c.vencidas} vencida${c.vencidas > 1 ? 's' : ''}`
  return `${c.abiertas}/${MAX_FACTURAS} facturas`
}

/** "0989664304-" o "099111/098222" -> primer número marcable */
function firstPhone(raw: string | null): string {
  const m = String(raw || '').match(/\d{7,10}/)
  return m ? m[0] : ''
}

const columns: Column[] = [
  { key: 'per_nombre', label: 'Cliente', sortable: true },
  { key: 'per_identificacion', label: 'RUC / Cédula' },
  { key: 'per_telefono', label: 'Teléfono' },
  { key: 'per_email', label: 'Email' },
  { key: 'credito', label: 'Crédito', align: 'center' },
  { key: 'ven_nombre', label: 'Vendedor', sortable: true },
]

const count = computed(() => (erp.clientes.fetchedAt ? erp.clientes.data.length : null))
</script>

<template>
  <div>
    <PageHeader
      title="Clientes"
      subtitle="Cartera de clientes registrada en el ERP"
      source="erp"
      :count="count"
      :refreshing="erp.clientes.loading && !!erp.clientes.fetchedAt"
      @refresh="erp.fetchClientes(true)"
    />

    <DataTable
      :columns="columns"
      :rows="erp.clientes.data"
      :loading="erp.clientes.loading && !erp.clientes.fetchedAt"
      :error="erp.clientes.error"
      :search-keys="['per_nombre', 'per_identificacion', 'per_email', 'ven_nombre']"
      search-placeholder="Buscar por nombre, RUC, email o vendedor…"
      clickable-rows
      @retry="erp.fetchClientes(true)"
      @row-click="verCliente"
    >
      <template #cell-per_nombre="{ row }">
        <div class="client">
          <span class="client__avatar">{{ initials(row.per_nombre) }}</span>
          <div>
            <strong>{{ row.per_nombre }}</strong>
            <small>{{ row.per_direccion || 'Sin dirección' }}</small>
          </div>
        </div>
      </template>

      <template #cell-per_email="{ value }">
        <a v-if="value" class="mail" :href="`mailto:${value}`">{{ value }}</a>
        <span v-else>—</span>
      </template>

      <template #cell-credito="{ row }">
        <BaseBadge :tone="creditoTone(row.per_nombre)">{{ creditoLabel(row.per_nombre) }}</BaseBadge>
      </template>

      <template #mobile-card="{ row }">
        <div class="mcard">
          <div class="mcard__top">
            <span class="client__avatar">{{ initials(row.per_nombre) }}</span>
            <div class="mcard__id">
              <strong>{{ row.per_nombre }}</strong>
              <small>{{ row.per_identificacion }}</small>
            </div>
            <BaseBadge :tone="creditoTone(row.per_nombre)">{{ creditoLabel(row.per_nombre) }}</BaseBadge>
          </div>
          <p class="mcard__line">{{ row.per_direccion || 'Sin dirección' }}</p>
          <p v-if="!isVendedor" class="mcard__line">Vendedor: {{ row.ven_nombre }}</p>
          <div class="mcard__actions" @click.stop>
            <a v-if="firstPhone(row.per_telefono)" :href="`tel:${firstPhone(row.per_telefono)}`">
              Llamar
            </a>
            <a v-if="row.per_email" :href="`mailto:${row.per_email}`">Email</a>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
.client {
  display: flex;
  align-items: center;
  gap: 10px;

  &__avatar {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--accent-soft);
    color: $primary;
    font-family: $font-principal;
    font-size: 0.66rem;
    font-weight: 800;
  }

  strong {
    display: block;
    font-weight: 600;
  }

  small {
    display: block;
    font-size: 0.7rem;
    color: var(--text-faint);
    max-width: 340px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.mail {
  color: $primary;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.mcard {
  font-family: $font-secondary;

  &__top {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__id {
    min-width: 0;

    strong {
      display: block;
      font-size: 0.86rem;
      font-weight: 700;
    }

    small {
      font-size: 0.72rem;
      color: var(--text-faint);
    }
  }

  &__line {
    margin-top: 6px;
    font-size: 0.76rem;
    color: var(--text-soft);
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;

    a {
      flex: 1;
      text-align: center;
      padding: 9px 0;
      border-radius: 8px;
      background: var(--accent-soft);
      color: $primary;
      font-size: 0.78rem;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.2s ease;

      &:active {
        background: rgba($primary, 0.22);
      }
    }
  }
}
</style>
