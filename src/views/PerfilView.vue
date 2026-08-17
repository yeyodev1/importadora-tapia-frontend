<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useErpStore } from '@/stores/erp'
import { useCobrosStore } from '@/stores/cobros'
import { erpService } from '@/services/erp.service'
import PageHeader from '@/components/ui/PageHeader.vue'
import { initials, formatMoney } from '@/utils/format'
import type { AppUser } from '@/types/erp'

const router = useRouter()
const userStore = useUserStore()
const erp = useErpStore()
const cobros = useCobrosStore()

const perfil = ref<AppUser | null>(null)

onMounted(async () => {
  userStore.hydrate()
  if (!userStore.isAdmin) {
    erp.fetchClientes()
    erp.fetchCarteraFacturas()
  }
  cobros.fetch()
  try {
    perfil.value = (await erpService.me()) as unknown as AppUser
  } catch {
    perfil.value = null
  }
})

const nombre = computed(() => perfil.value?.name || userStore.name || 'Usuario')
const rol = computed(() => (userStore.isAdmin ? 'Administrador' : 'Vendedor'))

const misClientes = computed(() => (userStore.isAdmin ? null : erp.clientes.data.length))
const miSaldo = computed(() =>
  userStore.isAdmin
    ? null
    : erp.carteraFacturas.data.reduce((s, f) => s + Number(f.saldo_pendiente || 0), 0),
)
const misCobros = computed(() => cobros.data.length)

function logout() {
  userStore.clear()
  router.push('/login')
}
</script>

<template>
  <div>
    <PageHeader title="Mi perfil" subtitle="Tu cuenta y tu actividad" />

    <section class="card">
      <span class="card__avatar">{{ initials(nombre) }}</span>
      <div class="card__id">
        <h2>{{ nombre }}</h2>
        <p>{{ perfil?.email || userStore.email }}</p>
        <span class="card__rol" :class="{ 'is-admin': userStore.isAdmin }">{{ rol }}</span>
        <span v-if="perfil?.venCodigo" class="card__cod">Vendedor ERP · código {{ perfil.venCodigo }}</span>
      </div>
      <button class="card__logout" type="button" @click="logout">Cerrar sesión</button>
    </section>

    <section class="stats" v-if="!userStore.isAdmin">
      <div class="stat">
        <span>Mis clientes</span>
        <b>{{ misClientes ?? '—' }}</b>
      </div>
      <div class="stat">
        <span>Saldo por cobrar</span>
        <b>{{ miSaldo !== null ? formatMoney(miSaldo) : '—' }}</b>
      </div>
      <div class="stat">
        <span>Cobros registrados</span>
        <b>{{ misCobros }}</b>
      </div>
    </section>

    <RouterLink to="/cobros" class="link-cobros">Ver mis cobros →</RouterLink>
  </div>
</template>

<style lang="scss" scoped>
.card {
  display: flex; align-items: center; gap: 18px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 24px; box-shadow: var(--shadow-card); margin-bottom: 16px;
  &__avatar {
    display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%;
    background: var(--accent-soft); color: $primary; font-size: 1.2rem; font-weight: 800; flex-shrink: 0;
  }
  &__id { flex: 1; min-width: 0;
    h2 { font-size: 1.15rem; font-weight: 800; }
    p { font-family: $font-secondary; font-size: 0.82rem; color: var(--text-soft); margin: 2px 0 8px; }
  }
  &__rol {
    display: inline-block; font-family: $font-secondary; font-size: 0.72rem; font-weight: 700;
    padding: 3px 11px; border-radius: 999px; background: rgba($secondary, 0.14); color: darken($secondary, 12%);
    &.is-admin { background: var(--accent-soft); color: $primary; }
  }
  &__cod { display: block; font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); margin-top: 6px; }
  &__logout {
    padding: 9px 16px; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--surface);
    font-family: $font-principal; font-size: 0.78rem; font-weight: 600; color: var(--text); cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease;
    &:hover { border-color: $alert-error; color: $alert-error; }
  }
  @media (max-width: 560px) { flex-wrap: wrap; &__logout { width: 100%; } }
}
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px;
  @media (max-width: 560px) { grid-template-columns: 1fr; } }
.stat {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 18px 20px; box-shadow: var(--shadow-card);
  span { font-family: $font-secondary; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); }
  b { display: block; margin-top: 6px; font-size: 1.4rem; font-weight: 800; font-variant-numeric: tabular-nums; }
}
.link-cobros { font-family: $font-secondary; font-size: 0.85rem; font-weight: 700; color: $primary; text-decoration: none;
  &:hover { text-decoration: underline; } }
</style>
