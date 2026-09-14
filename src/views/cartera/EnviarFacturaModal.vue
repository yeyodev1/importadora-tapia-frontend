<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { erpService } from '@/services/erp.service'
import { numeroFactura, textoFactura } from '@/utils/compartirFactura'
import type { FacturaCartera } from '@/types/erp'
import type { ApiError } from '@/types'

/** Envía el saldo de la factura por correo desde app@importadoratapia.app. */
const props = defineProps<{ open: boolean; factura: FacturaCartera | null }>()
const emit = defineEmits<{ close: [] }>()

const para = ref('')
const mensaje = ref('')
const enviando = ref(false)
const error = ref('')
const enviadoA = ref('')

watch(
  () => props.open,
  (o) => {
    if (!o) return
    para.value = ''
    mensaje.value = ''
    error.value = ''
    enviadoA.value = ''
  },
)

async function enviar() {
  if (!props.factura || enviando.value) return
  error.value = ''
  enviando.value = true
  try {
    await erpService.enviarFacturaCorreo(props.factura.trc_codigo, para.value.trim(), mensaje.value.trim())
    enviadoA.value = para.value.trim()
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo enviar el correo'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open && factura" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="enviar-factura-titulo">
          <header class="modal__head">
            <div>
              <h2 id="enviar-factura-titulo">Enviar factura {{ numeroFactura(factura) }}</h2>
              <p class="modal__hint">Sale desde <b>app@importadoratapia.app</b>. Si el cliente responde, te llega a tu correo.</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>

          <p v-if="enviadoA" class="listo" role="status">
            <i class="fa-solid fa-circle-check"></i> Correo enviado a <b>{{ enviadoA }}</b>.
          </p>

          <form v-else @submit.prevent="enviar">
            <label class="field">
              <span>Correo del destinatario</span>
              <input id="factura-para" v-model="para" type="email" required placeholder="cliente@correo.com" autocomplete="email" />
            </label>
            <label class="field">
              <span>Mensaje (opcional)</span>
              <textarea id="factura-mensaje" v-model="mensaje" rows="3" class="texto" maxlength="600" placeholder="Ej.: Le recordamos coordinar el pago esta semana."></textarea>
            </label>
            <pre class="previa" aria-label="Vista previa">{{ textoFactura(factura) }}</pre>
            <p v-if="error" class="modal__error" role="alert">{{ error }}</p>
            <div class="modal__actions">
              <div class="modal__btns">
                <button type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
                <button type="submit" class="modal__save" :disabled="!para.trim() || enviando">
                  <BaseSpinner v-if="enviando" :size="14" light />
                  Enviar correo
                </button>
              </div>
            </div>
          </form>

          <div v-if="enviadoA" class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__save" @click="emit('close')">Listo</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../equipo/form-modal';

.texto {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
  font-family: $font-secondary; font-size: 0.86rem; color: var(--text); background: var(--surface); resize: vertical;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}
.previa {
  margin: 4px 0 12px; padding: 12px; border-radius: 9px; background: rgba($primary-dark, 0.04);
  font-family: $font-secondary; font-size: 0.74rem; line-height: 1.5; color: var(--text-soft); white-space: pre-wrap;
}
.listo {
  display: flex; align-items: center; gap: 8px; margin: 8px 0 14px; padding: 12px; border-radius: 9px;
  background: rgba($secondary, 0.12); color: darken($secondary, 18%); font-family: $font-secondary; font-size: 0.84rem;
}
</style>
