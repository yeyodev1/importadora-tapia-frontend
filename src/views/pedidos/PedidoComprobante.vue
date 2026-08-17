<script setup lang="ts">
import { ref } from 'vue'
import { formatMoney, formatQty, formatDate } from '@/utils/format'
import type { Pedido } from '@/types/erp'

const props = defineProps<{ open: boolean; pedido: Pedido | null }>()
const emit = defineEmits<{ close: [] }>()

const sharing = ref(false)

const estadoTexto: Record<string, string> = {
  enviado: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

function imprimir() {
  window.print()
}

/** Comparte el comprobante como texto (Web Share API → WhatsApp en móvil). */
async function compartir() {
  if (!props.pedido) return
  const p = props.pedido
  const lineas = p.items
    .map((i) => `• ${i.productoNombre} — ${formatQty(i.cantidad)} ${i.unidad || ''} x ${formatMoney(i.precioUnitario)} = ${formatMoney(i.subtotal)}`)
    .join('\n')
  const texto = `IMPORTADORA TAPIA — Comprobante de pedido ${p.numero}
Cliente: ${p.clienteNombre}
Fecha: ${formatDate(p.createdAt)}

${lineas}

TOTAL: ${formatMoney(p.total)}
Estado: ${estadoTexto[p.estado]}`
  sharing.value = true
  try {
    if (navigator.share) {
      await navigator.share({ title: `Pedido ${p.numero}`, text: texto })
    } else {
      await navigator.clipboard.writeText(texto)
      window.alert('Comprobante copiado al portapapeles.')
    }
  } catch {
    /* usuario canceló */
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open && pedido" class="backdrop" @click.self="emit('close')">
        <div class="wrap">
          <div id="comprobante" class="doc">
            <header class="doc__head">
              <div class="doc__brand">
                <span class="doc__logo">IT</span>
                <div>
                  <strong>Importadora Tapia</strong>
                  <small>Comprobante de pedido</small>
                </div>
              </div>
              <div class="doc__num">
                <span>N.º de orden</span>
                <b>{{ pedido.numero }}</b>
              </div>
            </header>

            <div class="doc__meta">
              <div><span>Cliente</span><b>{{ pedido.clienteNombre }}</b></div>
              <div><span>Fecha</span><b>{{ formatDate(pedido.createdAt) }}</b></div>
              <div><span>Vendedor</span><b>{{ pedido.vendedorNombre }}</b></div>
              <div>
                <span>Estado</span>
                <b class="doc__estado" :class="`is-${pedido.estado}`">{{ estadoTexto[pedido.estado] }}</b>
              </div>
            </div>

            <table class="doc__table">
              <thead>
                <tr><th>Producto</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in pedido.items" :key="i">
                  <td>
                    {{ it.productoNombre }}
                    <small v-if="it.bodega">{{ it.bodega }}</small>
                  </td>
                  <td class="r">{{ formatQty(it.cantidad) }} {{ it.unidad }}</td>
                  <td class="r">{{ formatMoney(it.precioUnitario) }}</td>
                  <td class="r">{{ formatMoney(it.subtotal) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td colspan="3" class="r">Total</td><td class="r doc__total">{{ formatMoney(pedido.total) }}</td></tr>
              </tfoot>
            </table>

            <p v-if="pedido.observacion" class="doc__obs">{{ pedido.observacion }}</p>
            <p class="doc__foot">
              Este comprobante es un respaldo de la orden de pedido. La facturación se procesa
              en el sistema de Importadora Tapia.
            </p>
          </div>

          <div class="actions">
            <button type="button" class="ghost" @click="emit('close')">Cerrar</button>
            <button type="button" class="ghost" @click="imprimir">
              <i class="fa-solid fa-print"></i> Imprimir / PDF
            </button>
            <button type="button" class="primary" :disabled="sharing" @click="compartir">
              <i class="fa-solid fa-share-nodes"></i> Compartir
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.backdrop {
  position: fixed; inset: 0; z-index: 110; display: grid; place-items: center; padding: 16px;
  background: rgba($primary-dark, 0.55); backdrop-filter: blur(3px); overflow-y: auto;
}
.wrap { width: 100%; max-width: 460px; }
.doc {
  background: #fff; color: #0A1430; border-radius: 14px; padding: 26px 24px; box-shadow: var(--shadow-pop);
  font-family: $font-secondary;
  &__head { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 16px; border-bottom: 2px solid #0A1430; }
  &__brand { display: flex; align-items: center; gap: 10px;
    strong { display: block; font-family: $font-principal; font-size: 0.95rem; font-weight: 800; }
    small { font-size: 0.72rem; color: #5B6B8C; } }
  &__logo { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px;
    background: linear-gradient(135deg, $primary, darken($primary, 12%)); color: #fff; font-weight: 800; font-family: $font-principal; }
  &__num { text-align: right;
    span { display: block; font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.08em; color: #8593B0; }
    b { font-family: $font-principal; font-size: 1rem; font-weight: 800; color: $primary; } }
  &__meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;
    div span { display: block; font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.06em; color: #8593B0; }
    div b { font-size: 0.84rem; font-weight: 700; } }
  &__estado { &.is-aprobado { color: #17916C; } &.is-rechazado { color: #E5484D; } &.is-enviado { color: #1A7BB0; } }
  &__table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.8rem;
    th { text-align: left; font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.05em; color: #8593B0; padding: 8px 6px; border-bottom: 1px solid #E5E9F0; }
    th:not(:first-child), td.r { text-align: right; }
    td { padding: 9px 6px; border-bottom: 1px solid #F0F2F7; vertical-align: top;
      small { display: block; font-size: 0.64rem; color: #8593B0; } }
    tfoot td { border-bottom: none; padding-top: 12px; font-weight: 800; }
    &__total, .doc__total { font-size: 1.05rem; color: $primary; } }
  &__total { font-size: 1.05rem; color: $primary; }
  &__obs { margin-top: 14px; font-size: 0.76rem; color: #48587C; font-style: italic; }
  &__foot { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #E5E9F0; font-size: 0.68rem; color: #8593B0; }
}
.actions { display: flex; gap: 10px; margin-top: 16px;
  button { flex: 1; padding: 12px; border-radius: 10px; font-family: $font-principal; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
  .ghost { border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.1); color: #fff; }
  .primary { border: none; background: $primary; color: #fff; &:disabled { opacity: 0.7; } } }

@media print {
  .backdrop { position: static; background: #fff; padding: 0; display: block; }
  .actions { display: none; }
  .doc { box-shadow: none; border-radius: 0; }
}
</style>
