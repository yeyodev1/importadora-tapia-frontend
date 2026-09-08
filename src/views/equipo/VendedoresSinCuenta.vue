<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useErpStore } from '@/stores/erp'
import { useUsersStore } from '@/stores/users'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { initials } from '@/utils/format'
import type { Vendedor } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Vendedores del ERP que todavía no tienen cuenta: un clic y se crea. Los que
 * ya no trabajan con Tapia se ocultan (el ERP es de solo lectura) y se pueden
 * restaurar desde la misma pantalla.
 */
const emit = defineEmits<{ crear: [venCodigo: string] }>()

const erp = useErpStore()
const usersStore = useUsersStore()

onMounted(() => {
  erp.fetchVendedores()
  usersStore.fetchOcultos()
})

const pendientes = computed(() =>
  erp.vendedores.data.filter(
    (v) => !usersStore.venCodigosConCuenta.has(v.ven_codigo) && !usersStore.venCodigosOcultos.has(v.ven_codigo),
  ),
)

const aOcultar = ref<Vendedor | null>(null)
const ocultando = ref(false)
const error = ref('')
const verOcultos = ref(false)

async function ocultar() {
  if (!aOcultar.value) return
  ocultando.value = true
  error.value = ''
  try {
    await usersStore.ocultarVendedor(aOcultar.value.ven_codigo, aOcultar.value.ven_nombre)
    aOcultar.value = null
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo ocultar'
  } finally {
    ocultando.value = false
  }
}

async function restaurar(venCodigo: string) {
  try {
    await usersStore.restaurarVendedor(venCodigo)
  } catch {
    /* se reintenta desde la lista */
  }
}
</script>

<template>
  <section v-if="pendientes.length || usersStore.ocultos.length" class="sin-cuenta">
    <div class="sin-cuenta__head">
      <h2>Vendedores del ERP sin acceso <small>{{ pendientes.length }}</small></h2>
      <p>Existen en el sistema de Tapia pero aún no pueden entrar a la app. Si alguien ya no trabaja con ustedes, ocúltalo.</p>
    </div>

    <div v-if="pendientes.length" class="sin-cuenta__list">
      <div v-for="v in pendientes" :key="v.ven_codigo" class="pend">
        <span class="pend__avatar">{{ initials(v.ven_nombre) }}</span>
        <span class="pend__who">
          <strong>{{ v.ven_nombre }}</strong>
          <small>Código {{ v.ven_codigo }}</small>
        </span>
        <button type="button" class="pend__cta" @click="emit('crear', v.ven_codigo)">
          <i class="fa-solid fa-plus"></i> Crear acceso
        </button>
        <button type="button" class="pend__hide" title="Ya no trabaja con nosotros" aria-label="Ocultar vendedor" @click="aOcultar = v">
          <i class="fa-solid fa-user-slash"></i>
        </button>
      </div>
    </div>

    <div v-if="usersStore.ocultos.length" class="ocultos">
      <button type="button" class="ocultos__toggle" @click="verOcultos = !verOcultos">
        <i class="fa-solid" :class="verOcultos ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        {{ usersStore.ocultos.length }} vendedor{{ usersStore.ocultos.length > 1 ? 'es' : '' }} oculto{{ usersStore.ocultos.length > 1 ? 's' : '' }} (ya no trabajan con Tapia)
      </button>
      <div v-if="verOcultos" class="ocultos__list">
        <div v-for="o in usersStore.ocultos" :key="o.venCodigo" class="pend is-oculto">
          <span class="pend__avatar">{{ initials(o.venNombre) }}</span>
          <span class="pend__who">
            <strong>{{ o.venNombre }}</strong>
            <small>Código {{ o.venCodigo }} · ocultado por {{ o.ocultadoPor }}</small>
          </span>
          <button type="button" class="pend__restore" @click="restaurar(o.venCodigo)">
            <i class="fa-solid fa-rotate-left"></i> Restaurar
          </button>
        </div>
      </div>
    </div>

    <ConfirmModal
      :open="!!aOcultar"
      title="Ocultar vendedor"
      :subject="aOcultar ? `${aOcultar.ven_nombre} · código ${aOcultar.ven_codigo}` : ''"
      message="Dejará de aparecer en Vendedores y en esta lista. No se borra nada del ERP y lo puedes restaurar cuando quieras."
      confirm-label="Sí, ocultar"
      :loading="ocultando"
      :error="error"
      @cancel="aOcultar = null"
      @confirm="ocultar"
    />
  </section>
</template>

<style lang="scss" scoped>
.sin-cuenta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 26px;
  padding: 16px;
  border: 1px dashed rgba($primary, 0.4);
  border-radius: var(--radius);
  background: rgba($primary, 0.04);

  &__head {
    h2 {
      font-size: 0.92rem;
      font-weight: 800;
      small {
        font-family: $font-secondary;
        font-size: 0.72rem;
        font-weight: 600;
        color: $primary;
        background: var(--accent-soft);
        border-radius: 999px;
        padding: 2px 8px;
        margin-left: 6px;
      }
    }
    p { margin-top: 4px; font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); }
  }

  &__list { display: flex; flex-wrap: wrap; gap: 10px; }
}

.pend {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 100%;
  min-height: 56px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);

  @media (min-width: 640px) { flex: 1 1 calc(50% - 10px); }
  @media (min-width: 1100px) { flex: 1 1 calc(33.333% - 10px); }

  &.is-oculto { opacity: 0.75; }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba($secondary, 0.14);
    color: darken($secondary, 10%);
    font-size: 0.7rem;
    font-weight: 800;
  }

  &__who {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    strong { font-size: 0.8rem; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    small { font-family: $font-secondary; font-size: 0.68rem; color: var(--text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }

  &__cta,
  &__restore {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    min-height: 36px;
    padding: 0 10px;
    border: none;
    border-radius: 8px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    &:hover { background: darken($primary, 6%); }
  }

  &__restore { background: var(--surface); color: $primary; border: 1px solid rgba($primary, 0.4); &:hover { background: var(--accent-soft); } }

  &__hide {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-faint);
    cursor: pointer;
    &:hover { border-color: $alert-error; color: $alert-error; background: $alert-error-bg; }
  }
}

.ocultos {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    background: none;
    border: none;
    padding: 4px 0;
    font-family: $font-secondary;
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--text-soft);
    cursor: pointer;
    &:hover { color: $primary; }
  }

  &__list { display: flex; flex-wrap: wrap; gap: 10px; }
}
</style>
