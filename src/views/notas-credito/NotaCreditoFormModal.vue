<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useErpStore } from '@/stores/erp'
import { useNotasCreditoStore } from '@/stores/notasCredito'
import { notasCreditoService } from '@/services/notasCredito.service'
import { MOTIVO_NOTA_LABEL, type MotivoNotaCredito } from '@/types/notasCredito'
import type { Cliente } from '@/types/erp'
import type { ApiError } from '@/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const erp = useErpStore()
const store = useNotasCreditoStore()

const clienteNombre = ref('')
const clienteCodigo = ref<string | undefined>(undefined)
const buscarCliente = ref('')
const motivo = ref<MotivoNotaCredito | null>(null)
const comentario = ref('')
const saving = ref(false)
const error = ref('')

const MOTIVOS: { v: MotivoNotaCredito; icon: string }[] = [
  { v: 'precio', icon: 'fa-tag' },
  { v: 'calidad', icon: 'fa-box-open' },
  { v: 'otro', icon: 'fa-comment-dots' },
]

watch(
  () => props.open,
  (o) => {
    if (!o) return
    erp.fetchClientes()
    clienteNombre.value = ''
    clienteCodigo.value = undefined
    buscarCliente.value = ''
    motivo.value = null
    comentario.value = ''
    error.value = ''
  },
)

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const cargandoClientes = computed(() => erp.clientes.loading && !erp.clientes.data.length)
const resultadosClientes = computed(() => {
  const q = normalizar(buscarCliente.value.trim())
  if (q.length < 2) return []
  return erp.clientes.data
    .filter((c) => normalizar(c.per_nombre || '').includes(q) || (c.per_identificacion || '').includes(q))
    .slice(0, 8)
})

function elegirCliente(c: Cliente) {
  clienteNombre.value = (c.per_nombre || '').trim()
  clienteCodigo.value = String(c.per_codigo)
  buscarCliente.value = ''
}

function cambiarCliente() {
  clienteNombre.value = ''
  clienteCodigo.value = undefined
}

async function enviar() {
  if (saving.value) return
  error.value = ''
  if (!clienteCodigo.value) {
    error.value = 'Elige el cliente del listado de clientes.'
    return
  }
  if (!motivo.value) {
    error.value = 'Elige el motivo de la nota de crédito.'
    return
  }
  if (!comentario.value.trim()) {
    error.value = 'Escribe lo que indica el cliente: es lo que verá administración para aprobar.'
    return
  }
  saving.value = true
  try {
    const n = await notasCreditoService.create({
      clienteCodigo: clienteCodigo.value,
      clienteNombre: clienteNombre.value,
      motivo: motivo.value,
      comentario: comentario.value.trim(),
    })
    store.upsert(n)
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo enviar la solicitud'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="nc-titulo">
          <header class="modal__head">
            <div>
              <h2 id="nc-titulo">Solicitar nota de crédito</h2>
              <p class="modal__hint">Administración la revisa y, si la aprueba, genera la nota de crédito en el sistema de Tapia.</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <form @submit.prevent="enviar">
            <div class="fld">
              <span>Cliente <em>· obligatorio, del listado de clientes</em></span>
              <div v-if="clienteCodigo" class="cli-sel">
                <i class="fa-solid fa-user-check" aria-hidden="true"></i>
                <strong>{{ clienteNombre }}</strong>
                <button type="button" @click="cambiarCliente()">Cambiar</button>
              </div>
              <template v-else>
                <div class="search">
                  <i class="fa-solid fa-magnifying-glass"></i>
                  <input v-model="buscarCliente" type="search" placeholder="Buscar cliente por nombre o cédula/RUC…" autocomplete="off" />
                </div>
                <ul v-if="resultadosClientes.length" class="results">
                  <li v-for="c in resultadosClientes" :key="c.per_codigo" @click="elegirCliente(c)">
                    <span>{{ c.per_nombre }}</span>
                    <small>{{ c.per_identificacion }}<template v-if="c.per_direccion"> · {{ c.per_direccion }}</template></small>
                  </li>
                </ul>
                <p v-if="cargandoClientes" class="hint">Cargando clientes…</p>
              </template>
            </div>

            <div class="fld">
              <span>Motivo <em>· obligatorio</em></span>
              <div class="motivos">
                <button
                  v-for="m in MOTIVOS"
                  :key="m.v"
                  type="button"
                  class="motivo"
                  :class="{ 'is-on': motivo === m.v }"
                  @click="motivo = m.v"
                >
                  <i class="fa-solid" :class="m.icon"></i>
                  {{ MOTIVO_NOTA_LABEL[m.v] }}
                </button>
              </div>
            </div>

            <label class="fld">
              <span>¿Qué indica el cliente? <em>· obligatorio</em></span>
              <textarea
                v-model="comentario"
                rows="4"
                maxlength="1000"
                placeholder="Ej.: Cliente indica que se le baje $2 por saco en el pedido de lenteja porque la competencia le da más barato."
              ></textarea>
              <small class="hint">Esto es lo que lee administración para aprobar o rechazar.</small>
            </label>

            <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

            <div class="modal__actions">
              <div class="modal__btns">
                <button type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
                <button type="submit" class="modal__save" :disabled="saving">
                  <BaseSpinner v-if="saving" :size="14" light />
                  Enviar a aprobación
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../equipo/form-modal';

.fld {
  display: flex; flex-direction: column; gap: 6px;
  > span { font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; color: var(--text-soft);
    em { font-style: normal; font-weight: 700; color: $alert-error; } }
  textarea {
    padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
    font-family: $font-secondary; font-size: 0.9rem; color: var(--text); background: var(--surface); resize: vertical;
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
  }
}
.hint { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-faint); }
.cli-sel {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid rgba($secondary, 0.45); border-radius: 9px;
  background: rgba($secondary, 0.08); font-family: $font-secondary; color: darken($secondary, 15%);
  strong { flex: 1; min-width: 0; font-size: 0.86rem; color: var(--text); overflow-wrap: anywhere; }
  button { border: none; background: none; color: $primary; font-weight: 700; font-size: 0.76rem; cursor: pointer; padding: 4px; }
}
.search { position: relative; display: flex; align-items: center; gap: 8px;
  padding: 0 12px; border: 1px solid var(--border-strong); border-radius: 9px; color: var(--text-faint);
  i { font-size: 0.82rem; }
  input { border: none !important; box-shadow: none !important; padding: 11px 0; flex: 1; min-height: 0;
    font-family: $font-secondary; font-size: 0.88rem; color: var(--text); background: transparent;
    &:focus { outline: none; } }
}
.results { list-style: none; margin: 6px 0 0; border: 1px solid var(--border); border-radius: 9px; overflow: hidden;
  li { padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--border);
    &:last-child { border-bottom: none; } &:hover { background: rgba($primary, 0.05); }
    span { display: block; font-family: $font-secondary; font-size: 0.82rem; font-weight: 600; }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-faint); } }
}
.motivos { display: flex; flex-direction: column; gap: 8px;
  @media (min-width: 560px) { flex-direction: row; } }
.motivo {
  flex: 1; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 12px;
  border: 1.5px solid var(--border-strong); border-radius: 10px; background: var(--surface);
  font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; color: var(--text); cursor: pointer; text-align: left;
  i { color: var(--text-faint); }
  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: var(--accent-soft); color: $primary; i { color: $primary; } }
}
</style>
