<script setup lang="ts">
import { watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import PhotoUpload from '@/components/ui/PhotoUpload.vue'
import PlazoCreditoPicker from './PlazoCreditoPicker.vue'
import { usePedidoForm } from './usePedidoForm'
import { formatMoney, formatQty } from '@/utils/format'

const props = defineProps<{ open: boolean; clienteNombre?: string; clienteCodigo?: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const f = usePedidoForm()

watch(
  () => props.open,
  (o) => {
    if (o) f.reset(props.clienteNombre || '', props.clienteCodigo)
  },
)

async function guardar() {
  if (await f.guardar()) {
    emit('saved')
    emit('close')
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
            <input v-model="f.cliente.value" type="text" placeholder="Nombre del cliente" />
          </label>

          <div class="fld">
            <span>Plazo de crédito <em class="req">· obligatorio</em></span>
            <PlazoCreditoPicker v-model="f.plazoCreditoDias.value" />
            <small v-if="f.conflictoContado.value" class="aviso-contado">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Este pedido tiene productos que solo se venden al contado: elige "Contado" o quítalos.
            </small>
          </div>

          <div class="fld">
            <span>Agregar producto</span>
            <div class="search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input v-model="f.buscar.value" type="search" placeholder="Buscar en el inventario…" />
            </div>
            <ul v-if="f.resultados.value.length" class="results">
              <li
                v-for="r in f.resultados.value"
                :key="r.pro_codigo + r.bod_nombre"
                :class="{ 'is-agotado': r.disponible <= 0 }"
                @click="r.disponible > 0 && f.agregar(r)"
              >
                <span>{{ r.pro_nombre }} <em v-if="r.solo_contado" class="tag-contado">Solo contado</em></span>
                <small>
                  {{ r.bod_nombre }} ·
                  <b :class="r.disponible <= 0 ? 'x' : 'ok'">{{ formatQty(r.disponible) }} {{ r.uni_nombre }} disponible</b>
                  <template v-if="r.reservado > 0"> · {{ formatQty(r.reservado) }} reservado</template>
                </small>
              </li>
            </ul>
            <p v-if="f.cargandoInv.value" class="hint-inv">Cargando disponibilidad…</p>
          </div>

          <div v-if="f.lineas.value.length" class="lineas">
            <div v-for="(l, i) in f.lineas.value" :key="i" class="linea">
              <div class="linea__top">
                <strong>{{ l.productoNombre }} <em v-if="l.soloContado" class="tag-contado">Solo contado</em></strong>
                <button type="button" @click="f.quitar(i)"><i class="fa-solid fa-trash-can"></i></button>
              </div>
              <small class="linea__meta">
                {{ l.bodega }} · <b :class="{ over: l.cantidad > l.disponible }">{{ formatQty(l.disponible) }} {{ l.unidad }} disponible</b>
              </small>
              <div class="linea__inputs">
                <label>Cant.
                  <input v-model.number="l.cantidad" type="number" min="0" :max="l.disponible"
                    :class="{ 'is-over': l.cantidad > l.disponible }" />
                </label>
                <label>Precio<input v-model.number="l.precioUnitario" type="number" min="0" step="0.01" placeholder="0.00" /></label>
                <span class="linea__sub">{{ formatMoney(l.cantidad * l.precioUnitario) }}</span>
              </div>
              <small v-if="l.cantidad > l.disponible" class="linea__warn">
                Supera lo disponible ({{ formatQty(l.disponible) }})
              </small>
            </div>
          </div>

          <div class="fld">
            <span>Foto (opcional) <em class="opt">· local, nota manuscrita, etc.</em></span>
            <PhotoUpload v-model="f.foto.value" label="Adjuntar foto del pedido" />
          </div>

          <label class="fld">
            <span>Observación (opcional)</span>
            <textarea v-model="f.observacion.value" rows="2" placeholder="Notas del pedido"></textarea>
          </label>

          <p v-if="f.error.value" class="err" role="alert">{{ f.error.value }}</p>

          <div class="footer">
            <div class="footer__total">Total <b>{{ formatMoney(f.total.value) }}</b></div>
            <div class="footer__btns">
              <button type="button" class="ghost" @click="emit('close')">Cancelar</button>
              <button type="button" class="primary" :disabled="f.saving.value" @click="guardar">
                <BaseSpinner v-if="f.saving.value" :size="14" light />
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
  position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-end; justify-content: center;
  background: rgba($primary-dark, 0.5); backdrop-filter: blur(3px);
  @media (min-width: 641px) { align-items: center; padding: 16px; }
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
.tag-contado {
  display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 999px;
  background: rgba($secondary, 0.14); color: darken($secondary, 12%);
  font-family: $font-secondary; font-size: 0.64rem; font-weight: 700; font-style: normal; text-transform: uppercase; letter-spacing: 0.04em;
}
.aviso-contado {
  display: flex; align-items: center; gap: 6px; margin-top: 4px; padding: 8px 10px; border-radius: 8px;
  background: $alert-error-bg; color: darken($alert-error, 8%); font-family: $font-secondary; font-size: 0.74rem; font-weight: 600;
}
.fld { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;
  span { font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; color: var(--text-soft);
    .req {
  font-style: normal;
  font-weight: 700;
  color: $alert-error;
}

.opt { font-weight: 400; color: var(--text-faint); } }
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
    &.is-agotado { opacity: 0.5; cursor: not-allowed; &:hover { background: transparent; } }
    span { display: block; font-family: $font-secondary; font-size: 0.82rem; font-weight: 600; }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-faint);
      b { font-weight: 700; &.ok { color: darken($secondary, 10%); } &.x { color: $alert-error; } } } }
}
.hint-inv { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); margin: 6px 0 0; }
.lineas { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.linea { border: 1px solid var(--border); border-radius: 10px; padding: 12px;
  &__top { display: flex; align-items: center; justify-content: space-between;
    strong { font-family: $font-secondary; font-size: 0.82rem; font-weight: 700; }
    button { border: none; background: transparent; color: var(--text-faint); cursor: pointer; font-size: 0.85rem;
      &:hover { color: $alert-error; } } }
  &__meta { font-family: $font-secondary; font-size: 0.68rem; color: var(--text-faint);
    b { color: darken($secondary, 10%); &.over { color: $alert-error; } } }
  &__inputs { display: flex; align-items: flex-end; gap: 10px; margin-top: 8px;
    label { display: flex; flex-direction: column; gap: 3px; font-family: $font-secondary; font-size: 0.66rem; color: var(--text-faint); flex: 1;
      input { padding: 7px 9px; border: 1px solid var(--border-strong); border-radius: 7px; font-size: 0.85rem;
        &.is-over { border-color: $alert-error; background: $alert-error-bg; } } }
    .linea__sub { font-family: $font-secondary; font-weight: 800; font-size: 0.9rem; min-width: 74px; text-align: right; padding-bottom: 7px; } }
  &__warn { display: block; margin-top: 6px; font-family: $font-secondary; font-size: 0.68rem; font-weight: 600; color: $alert-error; }
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
