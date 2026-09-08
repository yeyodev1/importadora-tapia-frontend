<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useErpStore } from '@/stores/erp'
import { useUsersStore } from '@/stores/users'
import { initials } from '@/utils/format'

/** Vendedores del ERP que todavía no tienen cuenta: un clic y se crea. */
const emit = defineEmits<{ crear: [venCodigo: string] }>()

const erp = useErpStore()
const usersStore = useUsersStore()

onMounted(() => erp.fetchVendedores())

const pendientes = computed(() =>
  erp.vendedores.data.filter((v) => !usersStore.venCodigosConCuenta.has(v.ven_codigo)),
)
</script>

<template>
  <section v-if="pendientes.length" class="sin-cuenta">
    <div class="sin-cuenta__head">
      <h2>Vendedores del ERP sin acceso <small>{{ pendientes.length }}</small></h2>
      <p>Estos vendedores existen en el sistema de Tapia pero aún no pueden entrar a la app.</p>
    </div>
    <div class="sin-cuenta__list">
      <button
        v-for="v in pendientes"
        :key="v.ven_codigo"
        type="button"
        class="pend"
        @click="emit('crear', v.ven_codigo)"
      >
        <span class="pend__avatar">{{ initials(v.ven_nombre) }}</span>
        <span class="pend__who">
          <strong>{{ v.ven_nombre }}</strong>
          <small>Código {{ v.ven_codigo }}</small>
        </span>
        <span class="pend__cta"><i class="fa-solid fa-plus"></i> Crear acceso</span>
      </button>
    </div>
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

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
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
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s var(--ease-out);

  @media (min-width: 640px) { flex: 1 1 calc(50% - 10px); }
  @media (min-width: 1100px) { flex: 1 1 calc(33.333% - 10px); }

  &:hover { border-color: $primary; transform: translateY(-1px); }

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
    small { font-family: $font-secondary; font-size: 0.68rem; color: var(--text-faint); }
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 7px 10px;
    border-radius: 8px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-size: 0.72rem;
    font-weight: 700;
  }
}
</style>
