<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePedidosStore } from '@/stores/pedidos'
import { useUserStore } from '@/stores/user'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import PedidoFormModal from './pedidos/PedidoFormModal.vue'
import PedidoComprobante from './pedidos/PedidoComprobante.vue'
import { formatMoney, formatDate, formatQty } from '@/utils/format'
import type { EstadoPedido, Pedido } from '@/types/erp'

const pedidos = usePedidosStore()
const userStore = useUserStore()
const modalOpen = ref(false)
const expandido = ref<string | null>(null)
const comprobante = ref<Pedido | null>(null)

onMounted(() => pedidos.fetch())

const tone: Record<EstadoPedido, 'info' | 'success' | 'danger'> = {
  enviado: 'info',
  aprobado: 'success',
  rechazado: 'danger',
}
const label: Record<EstadoPedido, string> = {
  enviado: 'Sin aprobación',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

const total = computed(() => pedidos.data.reduce((s, p) => s + Number(p.total || 0), 0))

async function decidir(id: string, estado: 'aprobado' | 'rechazado') {
  let motivo: string | undefined
  if (estado === 'rechazado') {
    motivo = window.prompt('Motivo del rechazo (opcional):') || undefined
  }
  try {
    await pedidos.setEstado(id, estado, motivo)
  } catch {
    /* se refleja al recargar */
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Pedidos"
      subtitle="Órdenes de pedido. El vendedor arma la orden; administración la aprueba."
      source="local"
      :count="pedidos.fetchedAt ? pedidos.data.length : null"
      :refreshing="pedidos.loading && !!pedidos.fetchedAt"
      @refresh="pedidos.fetch(true)"
    >
      <template #actions>
        <span class="total">Total {{ formatMoney(total) }}</span>
        <button class="new" type="button" @click="modalOpen = true">+ Nuevo pedido</button>
      </template>
    </PageHeader>

    <SkeletonTable v-if="pedidos.loading && !pedidos.fetchedAt" :cols="4" :rows="6" />

    <EmptyState
      v-else-if="pedidos.error"
      tone="error"
      title="No se pudo cargar"
      :message="pedidos.error"
      @retry="pedidos.fetch(true)"
    />

    <EmptyState
      v-else-if="!pedidos.data.length"
      title="Sin pedidos"
      message="Crea el primer pedido con el botón de arriba: elige productos del inventario, cantidades y precio."
    />

    <ul v-else class="lista">
      <li v-for="(p, i) in pedidos.data" :key="p._id" class="ped stagger-item" :style="{ '--i': i }">
        <div class="ped__head" @click="expandido = expandido === p._id ? null : p._id">
          <div class="ped__info">
            <strong>{{ p.clienteNombre }} <code class="ped__num">{{ p.numero }}</code></strong>
            <small>
              {{ p.items.length }} producto{{ p.items.length > 1 ? 's' : '' }} · {{ formatDate(p.createdAt) }}
              <template v-if="userStore.isAdmin"> · {{ p.vendedorNombre }}</template>
            </small>
          </div>
          <div class="ped__right">
            <b>{{ formatMoney(p.total) }}</b>
            <BaseBadge :tone="tone[p.estado]">{{ label[p.estado] }}</BaseBadge>
            <i class="fa-solid fa-chevron-down ped__caret" :class="{ 'is-open': expandido === p._id }"></i>
          </div>
        </div>

        <div v-if="expandido === p._id" class="ped__detail">
          <div v-for="(it, j) in p.items" :key="j" class="item">
            <span class="item__name">{{ it.productoNombre }}</span>
            <span class="item__qty">{{ formatQty(it.cantidad) }} {{ it.unidad }} × {{ formatMoney(it.precioUnitario) }}</span>
            <span class="item__sub">{{ formatMoney(it.subtotal) }}</span>
          </div>
          <p v-if="p.observacion" class="ped__obs">{{ p.observacion }}</p>
          <p v-if="p.motivoRechazo" class="ped__rech">Rechazo: {{ p.motivoRechazo }}</p>

          <button type="button" class="ped__comp" @click="comprobante = p">
            <i class="fa-solid fa-file-invoice"></i> Ver comprobante
          </button>

          <div v-if="userStore.isAdmin && p.estado === 'enviado'" class="ped__acc">
            <button type="button" class="ok" @click="decidir(p._id, 'aprobado')">Aprobar</button>
            <button type="button" class="no" @click="decidir(p._id, 'rechazado')">Rechazar</button>
          </div>
        </div>
      </li>
    </ul>

    <PedidoFormModal :open="modalOpen" @close="modalOpen = false" />
    <PedidoComprobante :open="!!comprobante" :pedido="comprobante" @close="comprobante = null" />
  </div>
</template>

<style lang="scss" scoped>
.total { font-family: $font-secondary; font-size: 0.78rem; font-weight: 600;
  padding: 8px 14px; border-radius: 8px; background: var(--accent-soft); color: $primary; }
.new { padding: 9px 16px; border: none; border-radius: 8px; background: $primary; color: $white;
  font-family: $font-principal; font-size: 0.8rem; font-weight: 700; cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  &:hover { background: darken($primary, 6%); transform: translateY(-1px); } }
.lista { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.ped { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow-card); overflow: hidden;
  &__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 16px; cursor: pointer;
    &:hover { background: rgba($primary, 0.02); } }
  &__info { min-width: 0;
    strong { display: block; font-size: 0.88rem; font-weight: 700; }
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); } }
  &__right { display: flex; align-items: center; gap: 12px;
    b { font-size: 0.95rem; font-weight: 800; font-variant-numeric: tabular-nums; } }
  &__caret { font-size: 0.7rem; color: var(--text-faint); transition: transform 0.2s var(--ease-out);
    &.is-open { transform: rotate(180deg); } }
  &__detail { padding: 4px 16px 16px; border-top: 1px solid var(--border); }
  &__num { font-family: $font-secondary; font-size: 0.66rem; font-weight: 700; color: $primary;
    background: var(--accent-soft); border-radius: 5px; padding: 1px 6px; margin-left: 6px; }
  &__comp { margin-top: 12px; padding: 8px 14px; border: 1px solid var(--border-strong); border-radius: 8px;
    background: var(--surface); font-family: $font-principal; font-size: 0.76rem; font-weight: 700; color: var(--text); cursor: pointer;
    display: inline-flex; align-items: center; gap: 7px;
    &:hover { border-color: $primary; color: $primary; } }
  &__obs { font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); margin-top: 8px; font-style: italic; }
  &__rech { font-family: $font-secondary; font-size: 0.76rem; color: darken($alert-error, 6%); margin-top: 6px; }
  &__acc { display: flex; gap: 8px; margin-top: 12px;
    button { flex: 1; padding: 9px; border-radius: 8px; font-family: $font-principal; font-size: 0.78rem; font-weight: 700; cursor: pointer; border: 1px solid var(--border-strong); background: var(--surface); }
    .ok:hover { border-color: $secondary; color: darken($secondary, 10%); background: rgba($secondary, 0.08); }
    .no:hover { border-color: $alert-error; color: $alert-error; background: $alert-error-bg; } }
}
.item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border);
  font-family: $font-secondary; font-size: 0.8rem;
  &:last-of-type { border-bottom: none; }
  &__name { flex: 1; min-width: 0; font-weight: 600; }
  &__qty { color: var(--text-faint); font-size: 0.72rem; }
  &__sub { font-weight: 700; font-variant-numeric: tabular-nums; min-width: 70px; text-align: right; } }
</style>
