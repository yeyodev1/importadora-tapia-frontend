<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { usePedidosStore } from '@/stores/pedidos'
import { LABEL_ESTADO } from '../pedidos/estadoPedido'
import { formatQty } from '@/utils/format'
import type { InventarioItem } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Qué OP apartan el stock de un producto en una bodega. El ERP descuenta al
 * facturar: si una OP aprobada ya se facturó y no se marcó, aquí se marca.
 * Una OP marcada facturada sigue apartando lo que el ERP aún no baja; si el
 * ERP ya la descontó, aquí se confirma y su cantidad vuelve a quedar libre.
 */
const props = defineProps<{ producto: InventarioItem | null }>()
const emit = defineEmits<{ close: []; facturado: [id: string] }>()

const pedidos = usePedidosStore()
const guardando = ref<string | null>(null)
const error = ref('')

const lista = computed(() => props.producto?.reservadoPor || [])

async function marcar(id: string, pendienteErp?: boolean) {
  if (guardando.value) return
  guardando.value = id
  error.value = ''
  try {
    if (pendienteErp) await pedidos.setErpDescontado(id)
    else await pedidos.setFacturado(id, true)
    emit('facturado', id)
  } catch (e) {
    error.value = (e as ApiError)?.message || 'No se pudo marcar como facturado'
  } finally {
    guardando.value = null
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="producto" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="reservas-titulo">
          <header class="modal__head">
            <div>
              <h2 id="reservas-titulo">Stock apartado</h2>
              <p class="modal__hint">{{ producto.pro_nombre }} · {{ producto.bod_nombre }}</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <p class="ayuda">
            El ERP tiene <b>{{ formatQty(producto.stock_actual) }} {{ producto.uni_nombre }}</b> y descuenta al facturar.
            Estos pedidos aún no salen del stock del ERP, por eso su cantidad está apartada.
            Si alguno ya lo facturaste, márcalo. Los ya facturados siguen apartados hasta que el ERP baje el stock
            (máximo 48 h); si el ERP ya los descontó, confírmalo y vuelven a quedar disponibles.
          </p>

          <ul class="ops">
            <li v-for="r in lista" :key="r.id" class="op">
              <div class="op__info">
                <strong>{{ r.numero }} · {{ formatQty(r.cantidad) }} {{ producto.uni_nombre }}</strong>
                <small>
                  {{ r.clienteNombre }} ·
                  <template v-if="r.pendienteErp">Facturado en la app, el ERP aún no lo descuenta</template>
                  <template v-else>{{ LABEL_ESTADO[r.estado] || r.estado }}</template>
                </small>
              </div>
              <button v-if="r.estado === 'aprobado'" type="button" class="op__btn" :disabled="!!guardando" @click="marcar(r.id, r.pendienteErp)">
                <BaseSpinner v-if="guardando === r.id" :size="12" light />
                {{ r.pendienteErp ? 'El ERP ya lo descontó' : 'Ya está facturado' }}
              </button>
              <small v-else class="op__nota">Aún sin aprobar</small>
            </li>
            <li v-if="!lista.length" class="op op--vacio">Nada apartado: todo está disponible.</li>
          </ul>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="emit('close')">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../equipo/form-modal';
.ayuda { font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); margin-bottom: 10px;
  b { color: var(--text); } }
.ops { list-style: none; display: flex; flex-direction: column; gap: 6px; max-height: 50vh; overflow-y: auto; margin-bottom: 10px; }
.op {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 10px;
  font-family: $font-secondary;
  &__info { flex: 1; min-width: 0;
    strong { display: block; font-size: 0.82rem; font-weight: 700; overflow-wrap: anywhere; }
    small { font-size: 0.7rem; color: var(--text-faint); overflow-wrap: anywhere; } }
  &__btn { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 6px 12px;
    border: none; border-radius: 8px; background: $primary; color: $white; cursor: pointer;
    font-family: $font-principal; font-size: 0.74rem; font-weight: 700;
    &:disabled { opacity: 0.7; cursor: default; } }
  &__nota { flex-shrink: 0; font-size: 0.7rem; font-weight: 600; color: darken($alert-warning, 22%); }
  &--vacio { justify-content: center; font-size: 0.78rem; color: var(--text-faint); }
}
</style>
