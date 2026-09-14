<script setup lang="ts">
import { computed } from 'vue'
import { useErpStore } from '@/stores/erp'
import { numeroFactura, textoEstadoCuenta, textoFactura, urlWhatsApp } from '@/utils/compartirFactura'
import { formatMoney } from '@/utils/format'
import type { FacturaCartera } from '@/types/erp'

/** Pregunta qué enviar por WhatsApp: solo esta factura o todo lo que debe el cliente. */
const props = defineProps<{ open: boolean; factura: FacturaCartera }>()
const emit = defineEmits<{ close: [] }>()

const erp = useErpStore()

/** Facturas con saldo del mismo cliente (de la cartera que ve el usuario), más antiguas primero. */
const delCliente = computed(() => {
  const lista = erp.carteraFacturas.data
    .filter((f) => f.per_nombre === props.factura.per_nombre && Number(f.saldo_pendiente) > 0)
    .sort((a, b) => a.trc_fecha.localeCompare(b.trc_fecha))
  return lista.length ? lista : [props.factura]
})

const total = computed(() => delCliente.value.reduce((s, f) => s + Number(f.saldo_pendiente || 0), 0))
const urlSola = computed(() => urlWhatsApp(textoFactura(props.factura)))
const urlTodo = computed(() => urlWhatsApp(textoEstadoCuenta(props.factura.per_nombre, delCliente.value)))
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="wa-titulo">
          <header class="modal__head">
            <div>
              <h2 id="wa-titulo"><i class="fa-brands fa-whatsapp wa-icono" aria-hidden="true"></i> Compartir por WhatsApp</h2>
              <p class="modal__hint">¿Qué quieres enviar a {{ factura.per_nombre }}? Después eliges el contacto en WhatsApp.</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <div class="opciones">
            <a :href="urlSola" target="_blank" rel="noopener" class="opcion" @click="emit('close')">
              <i class="fa-solid fa-file-invoice opcion__icono" aria-hidden="true"></i>
              <span class="opcion__txt">
                <strong>Solo esta factura</strong>
                <small>N.º {{ numeroFactura(factura) }} · saldo {{ formatMoney(factura.saldo_pendiente) }}</small>
              </span>
              <i class="fa-brands fa-whatsapp opcion__wa"></i>
            </a>

            <a :href="urlTodo" target="_blank" rel="noopener" class="opcion is-todo" @click="emit('close')">
              <i class="fa-solid fa-chart-column opcion__icono" aria-hidden="true"></i>
              <span class="opcion__txt">
                <strong>Todo lo que debe el cliente</strong>
                <small>
                  {{ delCliente.length }} factura{{ delCliente.length === 1 ? '' : 's' }} pendiente{{ delCliente.length === 1 ? '' : 's' }}
                  · total {{ formatMoney(total) }}
                </small>
              </span>
              <i class="fa-brands fa-whatsapp opcion__wa"></i>
            </a>
          </div>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../equipo/form-modal';

.wa-icono { color: #25d366; }

.opciones {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 4px 0 14px;
}

.opcion {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 12px 14px;
  border: 1.5px solid var(--border-strong);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
  transition: border-color 0.2s ease, background 0.2s ease;

  &__icono { width: 34px; flex-shrink: 0; font-size: 1.5rem; text-align: center; color: $primary; }

  &__txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    strong { font-size: 0.92rem; font-weight: 800; }
    small { font-family: $font-secondary; font-size: 0.74rem; color: var(--text-soft); }
  }

  &__wa { font-size: 1.4rem; color: #25d366; flex-shrink: 0; }

  &:hover, &:focus-visible { border-color: #25d366; background: rgba(#25d366, 0.07); outline: none; }
  &.is-todo { border-color: rgba(#25d366, 0.45); }
}
</style>
