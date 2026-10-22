<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import NotaCreditoFormModal from './notas-credito/NotaCreditoFormModal.vue'
import RechazarNotaModal from './notas-credito/RechazarNotaModal.vue'
import { useNotasCreditoStore } from '@/stores/notasCredito'
import { useUserStore } from '@/stores/user'
import { notasCreditoService } from '@/services/notasCredito.service'
import { formatDate } from '@/utils/format'
import { ESTADO_NOTA_LABEL, ESTADO_NOTA_TONE, MOTIVO_NOTA_LABEL, type EstadoNotaCredito, type NotaCredito } from '@/types/notasCredito'
import type { ApiError } from '@/types'

const store = useNotasCreditoStore()
const userStore = useUserStore()

onMounted(() => store.fetch(true))

type Filtro = 'todas' | EstadoNotaCredito
const filtro = ref<Filtro>('todas')

const filtros = computed(() => {
  const base: { v: Filtro; label: string }[] = [
    { v: 'todas', label: 'Todas' },
    { v: 'pendiente', label: 'Por aprobar' },
    { v: 'aprobada', label: 'Aprobadas' },
    { v: 'rechazada', label: 'Rechazadas' },
  ]
  return base.map((f) => ({ ...f, n: store.data.filter((n) => f.v === 'todas' || n.estado === f.v).length }))
})

const lista = computed(() => store.data.filter((n) => filtro.value === 'todas' || n.estado === filtro.value))

const formAbierto = ref(false)

/** Revisión del admin: aprobar con confirmación, rechazar pidiendo motivo. */
const aprobando = ref<NotaCredito | null>(null)
const rechazando = ref<NotaCredito | null>(null)
const revisando = ref(false)
const errorRevision = ref('')

async function decidir(n: NotaCredito, estado: 'aprobada' | 'rechazada', motivo?: string) {
  if (revisando.value) return
  revisando.value = true
  errorRevision.value = ''
  try {
    store.upsert(await notasCreditoService.setEstado(n._id, estado, motivo))
    aprobando.value = null
    rechazando.value = null
  } catch (err) {
    errorRevision.value = (err as ApiError)?.message || 'No se pudo guardar la revisión'
  } finally {
    revisando.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Notas de crédito"
      subtitle="El asesor pide la nota; administración la aprueba y Tapia la genera en su sistema."
      source="local"
      :count="store.fetchedAt ? store.data.length : null"
      :refreshing="store.loading && !!store.fetchedAt"
      @refresh="store.fetch(true)"
    >
      <template #actions>
        <button class="nueva" type="button" @click="formAbierto = true">
          <i class="fa-solid fa-file-circle-minus"></i> Solicitar nota de crédito
        </button>
      </template>
    </PageHeader>

    <div class="filtros" role="group" aria-label="Filtrar notas de crédito">
      <button
        v-for="fl in filtros"
        :key="fl.v"
        type="button"
        class="filtro"
        :class="{ 'is-active': filtro === fl.v }"
        :aria-pressed="filtro === fl.v"
        @click="filtro = fl.v"
      >
        {{ fl.label }} <span>{{ fl.n }}</span>
      </button>
    </div>

    <SkeletonTable v-if="store.loading && !store.fetchedAt" :cols="3" :rows="5" />
    <EmptyState v-else-if="store.error" tone="error" title="No se pudo cargar" :message="store.error" @retry="store.fetch(true)" />
    <EmptyState
      v-else-if="!store.data.length"
      title="Sin notas de crédito todavía"
      message="Cuando un cliente pida una rebaja o reclame por calidad, toca «Solicitar nota de crédito»: eliges el cliente, cuentas lo que indica y administración la aprueba."
    />
    <EmptyState v-else-if="!lista.length" title="Nada en este filtro" message="Elige otro filtro para ver más notas." />

    <ul v-else class="lista">
      <li v-for="(n, i) in lista" :key="n._id" class="stagger-item" :style="{ '--i': i }">
        <article class="nota">
          <div class="nota__top">
            <span class="nota__info">
              <strong>{{ n.clienteNombre }} <code>{{ n.numero }}</code></strong>
              <small>
                {{ MOTIVO_NOTA_LABEL[n.motivo] }} · {{ formatDate(n.createdAt) }}
                <template v-if="userStore.isAdmin"> · {{ n.vendedorNombre }}</template>
              </small>
            </span>
            <BaseBadge :tone="ESTADO_NOTA_TONE[n.estado]">{{ ESTADO_NOTA_LABEL[n.estado] }}</BaseBadge>
          </div>

          <p class="nota__comentario">{{ n.comentario }}</p>

          <p v-if="n.estado === 'rechazada' && n.motivoRechazo" class="nota__rechazo">
            <i class="fa-solid fa-circle-xmark"></i> Rechazada: {{ n.motivoRechazo }}
          </p>
          <small v-if="n.revisadoPor" class="nota__revision">
            Revisada por {{ n.revisadoPor }}<template v-if="n.revisadoAt"> · {{ formatDate(n.revisadoAt) }}</template>
          </small>

          <div v-if="userStore.isAdmin && n.estado === 'pendiente'" class="nota__acciones">
            <button type="button" class="btn-rechazar" @click="errorRevision = ''; rechazando = n">
              <i class="fa-solid fa-xmark"></i> Rechazar
            </button>
            <button type="button" class="btn-aprobar" @click="errorRevision = ''; aprobando = n">
              <i class="fa-solid fa-check"></i> Aprobar
            </button>
          </div>
        </article>
      </li>
    </ul>

    <NotaCreditoFormModal :open="formAbierto" @close="formAbierto = false" />

    <ConfirmModal
      :open="!!aprobando"
      title="Aprobar nota de crédito"
      :subject="aprobando ? `${aprobando.numero} · ${aprobando.clienteNombre}` : ''"
      message="El asesor recibirá el aviso de que fue aprobada y Tapia genera la nota de crédito en su sistema."
      confirm-label="Aprobar"
      :loading="revisando"
      :error="errorRevision"
      @confirm="aprobando && decidir(aprobando, 'aprobada')"
      @cancel="aprobando = null"
    />

    <RechazarNotaModal
      :open="!!rechazando"
      :numero="rechazando?.numero || ''"
      :loading="revisando"
      :error="errorRevision"
      @confirm="(m) => rechazando && decidir(rechazando, 'rechazada', m)"
      @cancel="rechazando = null"
    />
  </div>
</template>

<style lang="scss" scoped>
.nueva {
  display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 16px; border: none; border-radius: 8px;
  background: $primary; color: $white; font-family: $font-principal; font-size: 0.8rem; font-weight: 700; cursor: pointer;
  &:hover { background: darken($primary, 6%); }
}
.filtros { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 14px; }
.filtro {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 0 13px;
  border: 1px solid var(--border-strong); border-radius: 999px; background: var(--surface);
  font-family: $font-secondary; font-size: 0.76rem; font-weight: 600; color: var(--text-soft); cursor: pointer;
  span { font-size: 0.68rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: rgba($primary-dark, 0.06); }
  &:hover { border-color: $primary; color: $primary; }
  &.is-active { background: $primary; border-color: $primary; color: $white; span { background: rgba($white, 0.22); } }
}
.lista { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.nota {
  padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--surface); box-shadow: var(--shadow-card);

  &__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  &__info {
    display: flex; flex-direction: column; gap: 3px; min-width: 0;
    strong { font-size: 0.88rem; font-weight: 700; color: var(--text); overflow-wrap: anywhere; }
    code { font-family: $font-secondary; font-size: 0.66rem; font-weight: 700; color: $primary; background: var(--accent-soft); border-radius: 5px; padding: 1px 6px; margin-left: 4px; }
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); }
  }
  &__comentario {
    margin-top: 10px; padding: 10px 12px; border-radius: 9px;
    background: rgba($primary-dark, 0.04); font-family: $font-secondary; font-size: 0.8rem; color: var(--text);
    overflow-wrap: anywhere;
  }
  &__rechazo {
    display: flex; gap: 6px; align-items: flex-start; margin-top: 8px; padding: 8px 10px; border-radius: 8px;
    background: $alert-error-bg; color: darken($alert-error, 8%); font-family: $font-secondary; font-size: 0.74rem; font-weight: 600;
  }
  &__revision { display: block; margin-top: 6px; font-family: $font-secondary; font-size: 0.68rem; color: var(--text-faint); }
  &__acciones { display: flex; gap: 8px; margin-top: 12px;
    button {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 42px;
      border-radius: 9px; font-family: $font-principal; font-size: 0.8rem; font-weight: 700; cursor: pointer;
    }
    @media (min-width: 560px) { justify-content: flex-end; button { flex: 0 0 auto; padding: 0 18px; } }
  }
}
.btn-aprobar { border: none; background: $secondary; color: $white; &:hover { background: darken($secondary, 6%); } }
.btn-rechazar { border: 1px solid rgba($alert-error, 0.5); background: var(--surface); color: darken($alert-error, 6%);
  &:hover { background: $alert-error-bg; } }
</style>
