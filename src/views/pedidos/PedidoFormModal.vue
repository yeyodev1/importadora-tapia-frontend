<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useErpStore } from '@/stores/erp'
import { usePedidosStore } from '@/stores/pedidos'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { formatMoney, formatQty } from '@/utils/format'
import type { ApiError } from '@/types'

interface Linea {
  productoCodigo: string
  productoNombre: string
  unidad?: string
  bodega?: string
  stock: number
  cantidad: number
  precioUnitario: number
}

const props = defineProps<{ open: boolean; clienteNombre?: string; clienteCodigo?: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const erp = useErpStore()
const pedidos = usePedidosStore()

const cliente = ref('')
const observacion = ref('')
const lineas = ref<Linea[]>([])
const buscar = ref('')
const saving = ref(false)
const error = ref('')

watch(
  () => props.open,
  (o) => {
    if (!o) return
    erp.fetchInventario()
    error.value = ''
    cliente.value = props.clienteNombre || ''
    observacion.value = ''
    lineas.value = []
    buscar.value = ''
  },
)

const resultados = computed(() => {
  const q = buscar.value.trim().toLowerCase()
  if (!q) return []
  return erp.inventario.data
    .filter((i) => i.pro_nombre.toLowerCase().includes(q))
    .slice(0, 6)
})

function agregar(item: (typeof erp.inventario.data)[number]) {
  const ya = lineas.value.find((l) => l.productoCodigo === item.pro_codigo && l.bodega === item.bod_nombre)
  if (ya) {
    ya.cantidad += 1
  } else {
    lineas.value.push({
      productoCodigo: item.pro_codigo,
      productoNombre: item.pro_nombre,
      unidad: item.uni_nombre,
      bodega: item.bod_nombre,
      stock: Number(item.stock_actual),
      cantidad: 1,
      precioUnitario: 0,
    })
  }
  buscar.value = ''
}

function quitar(i: number) {
  lineas.value.splice(i, 1)
}

const total = computed(() =>
  lineas.value.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0),
)

async function guardar() {
  if (saving.value) return
  error.value = ''
  if (!cliente.value) {
    error.value = 'Indica el cliente.'
    return
  }
  if (!lineas.value.length) {
    error.value = 'Agrega al menos un producto.'
    return
  }
  const sobreStock = lineas.value.find((l) => l.cantidad > l.stock)
  if (sobreStock) {
    error.value = `${sobreStock.productoNombre}: pediste ${sobreStock.cantidad} pero hay ${formatQty(sobreStock.stock)} en stock.`
    return
  }
  saving.value = true
  try {
    await pedidos.create({
      clienteNombre: cliente.value,
      clienteCodigo: props.clienteCodigo,
      items: lineas.value.map((l) => ({
        productoCodigo: l.productoCodigo,
        productoNombre: l.productoNombre,
        unidad: l.unidad,
        bodega: l.bodega,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
      })),
      observacion: observacion.value || undefined,
    })
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo enviar el pedido'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="backdrop" @click.self="emit('close')">
        <div class="sheet" role="dialog" aria-modal="true">
          <header class="sheet__head">
            <h2>Nuevo pedido</h2>
            <button class="sheet__x" type="button" aria-label="Cerrar" @click="emit('close')">✕</button>
          </header>
          <p class="sheet__note">
            El pedido se envía a administración para aprobación. No emite factura; Tapia lo
            procesa en su sistema.
          </p>

          <label class="fld">
            <span>Cliente</span>
            <input v-model="cliente" type="text" placeholder="Nombre del cliente" />
          </label>

          <div class="fld">
            <span>Agregar producto</span>
            <div class="search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input v-model="buscar" type="search" placeholder="Buscar en el inventario…" />
            </div>
            <ul v-if="resultados.length" class="results">
              <li v-for="r in resultados" :key="r.pro_codigo + r.bod_nombre" @click="agregar(r)">
                <span>{{ r.pro_nombre }}</span>
                <small>{{ r.bod_nombre }} · {{ formatQty(r.stock_actual) }} {{ r.uni_nombre }}</small>
              </li>
            </ul>
          </div>

          <div v-if="lineas.length" class="lineas">
            <div v-for="(l, i) in lineas" :key="i" class="linea">
              <div class="linea__top">
                <strong>{{ l.productoNombre }}</strong>
                <button type="button" @click="quitar(i)"><i class="fa-solid fa-trash-can"></i></button>
              </div>
              <small class="linea__meta">{{ l.bodega }} · stock {{ formatQty(l.stock) }} {{ l.unidad }}</small>
              <div class="linea__inputs">
                <label>Cant.<input v-model.number="l.cantidad" type="number" min="0" :max="l.stock" /></label>
                <label>Precio<input v-model.number="l.precioUnitario" type="number" min="0" step="0.01" placeholder="0.00" /></label>
                <span class="linea__sub">{{ formatMoney(l.cantidad * l.precioUnitario) }}</span>
              </div>
            </div>
          </div>

          <label class="fld">
            <span>Observación (opcional)</span>
            <textarea v-model="observacion" rows="2" placeholder="Notas del pedido"></textarea>
          </label>

          <p v-if="error" class="err" role="alert">{{ error }}</p>

          <div class="footer">
            <div class="footer__total">Total <b>{{ formatMoney(total) }}</b></div>
            <div class="footer__btns">
              <button type="button" class="ghost" @click="emit('close')">Cancelar</button>
              <button type="button" class="primary" :disabled="saving" @click="guardar">
                <BaseSpinner v-if="saving" :size="14" light />
                Enviar pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.backdrop {
  position: fixed; inset: 0; z-index: 100; display: grid; place-items: end center;
  background: rgba($primary-dark, 0.5); backdrop-filter: blur(3px);
  @media (min-width: 641px) { place-items: center; padding: 16px; }
}
.sheet {
  width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto;
  background: var(--surface); box-shadow: var(--shadow-pop);
  border-radius: 18px 18px 0 0; padding: 22px 20px 20px;
  @media (min-width: 641px) { border-radius: 16px; }
  &__head { display: flex; align-items: center; justify-content: space-between; }
  &__head h2 { font-size: 1.1rem; font-weight: 800; }
  &__x { border: none; background: transparent; font-size: 1rem; color: var(--text-faint); cursor: pointer; padding: 4px 8px; }
  &__note { margin: 8px 0 16px; font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft);
    background: rgba($primary, 0.06); border: 1px solid rgba($primary, 0.14); border-radius: 9px; padding: 10px 12px; }
}
.fld { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;
  span { font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; color: var(--text-soft); }
  input, textarea { padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
    font-family: $font-secondary; font-size: 0.88rem; color: var(--text); background: var(--surface);
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); } }
}
.search { position: relative; display: flex; align-items: center; gap: 8px;
  padding: 0 12px; border: 1px solid var(--border-strong); border-radius: 9px; color: var(--text-faint);
  i { font-size: 0.82rem; }
  input { border: none; box-shadow: none !important; padding: 10px 0; flex: 1; }
}
.results { list-style: none; margin: 6px 0 0; border: 1px solid var(--border); border-radius: 9px; overflow: hidden;
  li { padding: 9px 12px; cursor: pointer; border-bottom: 1px solid var(--border);
    &:last-child { border-bottom: none; } &:hover { background: rgba($primary, 0.05); }
    span { display: block; font-family: $font-secondary; font-size: 0.82rem; font-weight: 600; }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-faint); } }
}
.lineas { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.linea { border: 1px solid var(--border); border-radius: 10px; padding: 12px;
  &__top { display: flex; align-items: center; justify-content: space-between;
    strong { font-family: $font-secondary; font-size: 0.82rem; font-weight: 700; }
    button { border: none; background: transparent; color: var(--text-faint); cursor: pointer; font-size: 0.85rem;
      &:hover { color: $alert-error; } } }
  &__meta { font-family: $font-secondary; font-size: 0.68rem; color: var(--text-faint); }
  &__inputs { display: flex; align-items: flex-end; gap: 10px; margin-top: 8px;
    label { display: flex; flex-direction: column; gap: 3px; font-family: $font-secondary; font-size: 0.66rem; color: var(--text-faint); flex: 1;
      input { padding: 7px 9px; border: 1px solid var(--border-strong); border-radius: 7px; font-size: 0.85rem; } }
    .linea__sub { font-family: $font-secondary; font-weight: 800; font-size: 0.9rem; min-width: 74px; text-align: right; padding-bottom: 7px; } }
}
.err { font-family: $font-secondary; font-size: 0.78rem; color: darken($alert-error, 8%);
  background: $alert-error-bg; border-radius: 8px; padding: 9px 12px; margin: 0 0 12px; }
.footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  &__total { font-family: $font-secondary; font-size: 0.8rem; color: var(--text-soft);
    b { font-size: 1.15rem; font-weight: 800; color: var(--text); margin-left: 6px; } }
  &__btns { display: flex; gap: 10px; }
  button { padding: 11px 18px; border-radius: 10px; font-family: $font-principal; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
  .ghost { border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
  .primary { border: none; background: $primary; color: $white; &:hover:not(:disabled) { background: darken($primary, 6%); } &:disabled { opacity: 0.8; } }
}
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; .sheet { transition: transform 0.25s var(--ease-out); } }
.modal-enter-from, .modal-leave-to { opacity: 0; .sheet { transform: translateY(30px); } }
</style>
