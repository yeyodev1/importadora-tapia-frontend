<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useUsersStore } from '@/stores/users'
import { erpService } from '@/services/erp.service'
import { formatQty } from '@/utils/format'
import type { CupoProducto } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Admin: cupo por asesor de un producto escaso (p.ej. llegó un contenedor de
 * lenteja y a cada asesor le tocan X sacos). Al enviar un pedido que pasa su
 * cupo, la app no lo deja. Asesor sin cupo = sin límite.
 */
const props = defineProps<{ producto: { pro_codigo: string; pro_nombre: string } | null; cupo: CupoProducto | null }>()
const emit = defineEmits<{ close: []; guardado: [proCodigo: string, cupo: CupoProducto | null] }>()

const users = useUsersStore()
const cantidades = ref<Record<string, string>>({})
const reiniciar = ref(false)
const guardando = ref(false)
const error = ref('')

const asesores = computed(() =>
  users.data
    .filter((u) => u.role === 'vendedor' && u.venCodigo)
    .sort((a, b) => a.name.localeCompare(b.name)),
)
const usoDe = (venCodigo: string) => props.cupo?.cupos.find((c) => c.venCodigo === venCodigo)

watch(
  () => props.producto,
  (p) => {
    if (!p) return
    users.fetch()
    const m: Record<string, string> = {}
    for (const c of props.cupo?.cupos || []) m[c.venCodigo] = String(c.cantidad)
    cantidades.value = m
    reiniciar.value = false
    error.value = ''
  },
)

const lista = computed(() =>
  asesores.value
    .filter((u) => String(cantidades.value[u.venCodigo!] ?? '').trim() !== '')
    .map((u) => ({ venCodigo: u.venCodigo!, nombre: u.name, cantidad: Number(cantidades.value[u.venCodigo!]) })),
)
const invalida = computed(() => lista.value.some((c) => !Number.isFinite(c.cantidad) || c.cantidad < 0))
const totalCupos = computed(() => lista.value.reduce((s, c) => s + (Number.isFinite(c.cantidad) ? c.cantidad : 0), 0))
const desde = computed(() =>
  props.cupo ? new Date(props.cupo.desde).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
)

async function guardar(quitar = false) {
  if (!props.producto || guardando.value || (!quitar && invalida.value)) return
  guardando.value = true
  error.value = ''
  try {
    const r = await erpService.guardarCupos(props.producto.pro_codigo, {
      proNombre: props.producto.pro_nombre,
      reiniciar: reiniciar.value,
      cupos: quitar ? [] : lista.value,
    })
    emit('guardado', props.producto.pro_codigo, r)
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudieron guardar los cupos. Vuelve a intentar.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="producto" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cupos-titulo">
          <header class="modal__head">
            <div>
              <h2 id="cupos-titulo">Cupos por asesor</h2>
              <p class="modal__hint">{{ producto.pro_nombre }} · {{ producto.pro_codigo }}</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <p class="ayuda">
            Cuánto puede pedir cada asesor de este producto. Si un pedido pasa su cupo, la app no lo deja enviar.
            Deja vacío a quien no tiene límite. Lo anulado, no aprobado o ajustado le devuelve cupo.
            <template v-if="cupo"><br />Contando desde el {{ desde }}.</template>
          </p>

          <p v-if="users.loading && !users.fetchedAt" class="ayuda"><BaseSpinner :size="14" /> Cargando asesores…</p>
          <ul v-else class="asesores">
            <li v-for="u in asesores" :key="u.id" class="asesor">
              <div class="asesor__info">
                <strong>{{ u.name }}</strong>
                <small v-if="usoDe(u.venCodigo!)">
                  Lleva {{ formatQty(usoDe(u.venCodigo!)!.usado) }} · le quedan <b>{{ formatQty(usoDe(u.venCodigo!)!.queda) }}</b>
                </small>
                <small v-else>Sin límite</small>
              </div>
              <input
                v-model="cantidades[u.venCodigo!]"
                type="number"
                inputmode="decimal"
                min="0"
                placeholder="Sin límite"
                class="asesor__qty"
                :aria-label="`Cupo de ${u.name}`"
              />
            </li>
          </ul>

          <label v-if="cupo" class="reiniciar">
            <input v-model="reiniciar" type="checkbox" />
            Llegó mercadería nueva: empezar a contar desde cero
          </label>

          <p class="total">Total repartido <b>{{ formatQty(totalCupos) }}</b></p>
          <small v-if="invalida" class="falta">Revisa los cupos: deben ser 0 o más.</small>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button v-if="cupo" type="button" class="modal__cancel" :disabled="guardando" @click="guardar(true)">Quitar cupo</button>
              <button v-else type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
              <button type="button" class="modal__save" :disabled="guardando || invalida" @click="guardar()">
                <BaseSpinner v-if="guardando" :size="14" light />
                Guardar cupos
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

.ayuda { font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); margin-bottom: 10px; }
.asesores { list-style: none; display: flex; flex-direction: column; gap: 6px; max-height: 46vh; overflow-y: auto; margin-bottom: 10px; }
.asesor {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 10px;
  font-family: $font-secondary;
  &__info { flex: 1; min-width: 0;
    strong { display: block; font-size: 0.82rem; font-weight: 700; overflow-wrap: anywhere; }
    small { font-size: 0.7rem; color: var(--text-faint); b { color: var(--text); } } }
  &__qty { width: 104px; min-height: 40px; padding: 6px 8px; border: 1px solid var(--border-strong); border-radius: 8px;
    font-family: $font-secondary; font-size: 0.9rem; font-weight: 700; text-align: right; color: var(--text); background: var(--surface);
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); } }
}
.reiniciar { display: flex; align-items: center; gap: 8px; min-height: 40px; font-family: $font-secondary; font-size: 0.78rem; font-weight: 600; cursor: pointer;
  input { width: 18px; height: 18px; accent-color: $primary; } }
.total { font-family: $font-secondary; font-size: 0.8rem; b { font-weight: 800; font-variant-numeric: tabular-nums; } }
.falta { display: block; font-family: $font-secondary; font-size: 0.7rem; color: darken($alert-warning, 22%); }
</style>
