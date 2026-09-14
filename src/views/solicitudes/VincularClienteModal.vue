<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useErpStore } from '@/stores/erp'
import type { SolicitudCredito } from '@/types/solicitudes'

/**
 * Relaciona la solicitud con el cliente del ERP. Sugiere primero los clientes
 * cuya cédula/RUC coincide (lo normal cuando Tapia ya lo creó en su sistema).
 */
const props = defineProps<{ open: boolean; solicitud: SolicitudCredito; loading: boolean; error: string }>()
const emit = defineEmits<{ confirm: [codigo: string]; cancel: [] }>()

const erp = useErpStore()
const filtro = ref('')
const elegido = ref('')

watch(
  () => props.open,
  (o) => {
    if (!o) return
    erp.fetchClientes()
    filtro.value = ''
    elegido.value = props.solicitud.clienteCodigo || ''
  },
)

const diez = (x: string | null | undefined) => String(x || '').replace(/\D/g, '').slice(0, 10)

const sugeridos = computed(() => {
  const ids = [props.solicitud.titular.cedula, props.solicitud.negocio.ruc].map(diez).filter((x) => x.length === 10)
  if (!ids.length) return []
  return erp.clientes.data.filter((c) => ids.includes(diez(c.per_identificacion))).slice(0, 5)
})

const lista = computed(() => {
  const q = filtro.value.trim().toLowerCase()
  if (!q) return sugeridos.value
  return erp.clientes.data
    .filter(
      (c) =>
        c.per_nombre.toLowerCase().includes(q) ||
        String(c.per_identificacion || '').includes(q) ||
        String(c.per_codigo) === q,
    )
    .slice(0, 8)
})
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('cancel')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="vincular-titulo">
          <header class="modal__head">
            <div>
              <h2 id="vincular-titulo">Relacionar con cliente del ERP</h2>
              <p class="modal__hint">
                Cuando Tapia cree al cliente en su sistema, búscalo aquí. La solicitud y sus documentos
                aparecerán en la ficha del cliente.
              </p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('cancel')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <input
            id="vincular-buscar"
            v-model="filtro"
            type="search"
            class="buscar"
            placeholder="Buscar por nombre, cédula, RUC o código…"
            aria-label="Buscar cliente del ERP"
          />

          <p class="etiqueta">{{ filtro.trim() ? 'Resultados' : 'Coinciden por cédula o RUC' }}</p>

          <p v-if="erp.clientes.loading && !erp.clientes.data.length" class="estado">
            <BaseSpinner :size="12" /> Cargando clientes del ERP…
          </p>
          <p v-else-if="!lista.length" class="estado">
            {{ filtro.trim() ? `Ningún cliente coincide con "${filtro}".` : 'Aún no hay un cliente con esa cédula o RUC en el ERP. Búscalo por nombre.' }}
          </p>
          <div v-else class="lista">
            <button
              v-for="c in lista"
              :key="c.per_codigo"
              type="button"
              class="cli"
              :class="{ 'is-active': elegido === c.per_codigo }"
              :aria-pressed="elegido === c.per_codigo"
              @click="elegido = c.per_codigo"
            >
              <span class="cli__txt">
                <strong>{{ c.per_nombre }}</strong>
                <small>{{ c.per_identificacion }} · código {{ c.per_codigo }}</small>
              </span>
              <i v-if="elegido === c.per_codigo" class="fa-solid fa-check"></i>
            </button>
          </div>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <button
              v-if="solicitud.clienteCodigo"
              type="button"
              class="quitar"
              :disabled="loading"
              @click="emit('confirm', '')"
            >Quitar relación</button>
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="emit('cancel')">Cancelar</button>
              <button
                type="button"
                class="modal__save"
                :disabled="!elegido || elegido === solicitud.clienteCodigo || loading"
                @click="emit('confirm', elegido)"
              >
                <BaseSpinner v-if="loading" :size="14" light />
                Relacionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../equipo/form-modal';

.buscar {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
  font-family: $font-secondary; font-size: 0.86rem; color: var(--text); background: var(--surface);
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
.etiqueta {
  margin: 12px 0 6px; font-family: $font-secondary; font-size: 0.68rem; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-faint);
}
.estado {
  display: flex; align-items: center; gap: 8px;
  font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft);
}
.lista { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
.cli {
  display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 12px;
  border: 1px solid var(--border-strong); border-radius: 9px; background: var(--surface); text-align: left; cursor: pointer;
  &__txt {
    flex: 1; min-width: 0; display: flex; flex-direction: column;
    strong { font-size: 0.82rem; font-weight: 700; color: var(--text); }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-faint); }
  }
  i { color: $primary; }
  &:hover { border-color: $primary; }
  &.is-active { border-color: $primary; background: var(--accent-soft); }
}
.quitar {
  border: none; background: transparent; padding: 8px 0; cursor: pointer;
  font-family: $font-secondary; font-size: 0.78rem; font-weight: 700; color: $alert-error;
}
</style>
