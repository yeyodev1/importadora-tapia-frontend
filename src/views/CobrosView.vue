<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCobrosStore } from '@/stores/cobros'
import { useUserStore } from '@/stores/user'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import CobroFormModal from './cobros/CobroFormModal.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import { formatMoney, formatDate } from '@/utils/format'
import type { EstadoCobro, MetodoPago } from '@/types/erp'

const cobros = useCobrosStore()
const userStore = useUserStore()
const modalOpen = ref(false)

onMounted(() => cobros.fetch())

const total = computed(() => cobros.data.reduce((s, c) => s + Number(c.monto || 0), 0))

const metodoLabel: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  deposito: 'Depósito',
}
const estadoTone: Record<EstadoCobro, 'neutral' | 'success' | 'danger'> = {
  registrado: 'neutral',
  aplicado: 'success',
  rechazado: 'danger',
}
const estadoLabel: Record<EstadoCobro, string> = {
  registrado: 'Registrado',
  aplicado: 'Aplicado',
  rechazado: 'Rechazado',
}

async function aplicar(id: string, estado: 'aplicado' | 'rechazado') {
  try {
    await cobros.setEstado(id, estado)
  } catch {
    /* el error se refleja al recargar */
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Cobros"
      subtitle="Registro de cobros con respaldo. No emite factura ni toca el ERP."
      source="local"
      :count="cobros.fetchedAt ? cobros.data.length : null"
      :refreshing="cobros.loading && !!cobros.fetchedAt"
      @refresh="cobros.fetch(true)"
    >
      <template #actions>
        <span class="total">Total {{ formatMoney(total) }}</span>
        <button class="new" type="button" @click="modalOpen = true">+ Registrar cobro</button>
      </template>
    </PageHeader>

    <SkeletonTable v-if="cobros.loading && !cobros.fetchedAt" :cols="5" :rows="6" />

    <EmptyState
      v-else-if="cobros.error"
      tone="error"
      title="No se pudo cargar"
      :message="cobros.error"
      @retry="cobros.fetch(true)"
    />

    <EmptyState
      v-else-if="!cobros.data.length"
      title="Sin cobros registrados"
      message="Registra el primer cobro con el botón de arriba: monto, método de pago y foto del comprobante."
    />

    <ul v-else class="lista">
      <li v-for="(c, i) in cobros.data" :key="c._id" class="cobro stagger-item" :style="{ '--i': i }">
        <a :href="c.comprobanteUrl" target="_blank" rel="noopener" class="cobro__foto">
          <img :src="c.comprobanteUrl" alt="Comprobante" loading="lazy" />
        </a>
        <div class="cobro__info">
          <strong>{{ c.clienteNombre }}</strong>
          <small>
            {{ metodoLabel[c.metodoPago] }}
            <template v-if="c.facturaRef"> · Fact. {{ c.facturaRef }}</template>
            · {{ formatDate(c.createdAt) }}
            <template v-if="!userStore.isAdmin === false"> · {{ c.vendedorNombre }}</template>
          </small>
          <em v-if="c.observacion" class="cobro__obs">{{ c.observacion }}</em>
        </div>
        <div class="cobro__right">
          <b class="cobro__monto">{{ formatMoney(c.monto) }}</b>
          <BaseBadge :tone="estadoTone[c.estado]">{{ estadoLabel[c.estado] }}</BaseBadge>
          <div v-if="userStore.isAdmin && c.estado === 'registrado'" class="cobro__acc">
            <button type="button" class="ok" @click="aplicar(c._id, 'aplicado')">Aplicar</button>
            <button type="button" class="no" @click="aplicar(c._id, 'rechazado')">Rechazar</button>
          </div>
        </div>
      </li>
    </ul>

    <CobroFormModal :open="modalOpen" @close="modalOpen = false" />
  </div>
</template>

<style lang="scss" scoped>
.total {
  font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; color: var(--text-soft);
  padding: 8px 14px; border-radius: 8px; background: var(--accent-soft); color: $primary;
}
.new {
  padding: 9px 16px; border: none; border-radius: 8px; background: $primary; color: $white;
  font-family: $font-principal; font-size: 0.8rem; font-weight: 700; cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  &:hover { background: darken($primary, 6%); transform: translateY(-1px); }
}
.lista { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.cobro {
  display: flex; align-items: center; gap: 14px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 14px; box-shadow: var(--shadow-card);
  &__foto {
    flex-shrink: 0; width: 54px; height: 54px; border-radius: 10px; overflow: hidden;
    border: 1px solid var(--border); background: var(--ground);
    img { width: 100%; height: 100%; object-fit: cover; }
  }
  &__info { flex: 1; min-width: 0;
    strong { display: block; font-size: 0.88rem; font-weight: 700; }
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); }
  }
  &__obs { display: block; font-family: $font-secondary; font-size: 0.74rem; color: var(--text-soft); margin-top: 3px; font-style: italic; }
  &__right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  &__monto { font-size: 1rem; font-weight: 800; font-variant-numeric: tabular-nums; }
  &__acc { display: flex; gap: 6px; margin-top: 2px;
    button { padding: 5px 10px; border-radius: 6px; font-family: $font-principal; font-size: 0.7rem; font-weight: 700; cursor: pointer; border: 1px solid var(--border-strong); background: var(--surface); }
    .ok:hover { border-color: $secondary; color: darken($secondary, 10%); }
    .no:hover { border-color: $alert-error; color: $alert-error; }
  }
  @media (max-width: 560px) { flex-wrap: wrap;
    &__right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; }
  }
}
</style>
