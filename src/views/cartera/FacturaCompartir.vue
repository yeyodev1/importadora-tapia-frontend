<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFacturaAdjuntosStore } from '@/stores/facturaAdjuntos'
import { numeroFactura } from '@/utils/compartirFactura'
import WhatsAppOpciones from './WhatsAppOpciones.vue'
import type { FacturaCartera } from '@/types/erp'

/** Acciones por factura: foto de la factura física, WhatsApp (elige qué enviar) y correo. */
const props = defineProps<{ factura: FacturaCartera; /** Solo íconos (dentro de la tabla de escritorio). */ compacto?: boolean }>()
const emit = defineEmits<{ correo: [f: FacturaCartera]; adjuntos: [f: FacturaCartera] }>()

const adjuntos = useFacturaAdjuntosStore()
const nArchivos = computed(() => adjuntos.porFactura.get(String(props.factura.trc_codigo))?.length || 0)

/** Pregunta si enviar solo esta factura o todo lo que debe el cliente. */
const waOpen = ref(false)
</script>

<template>
  <div class="share" :class="{ 'is-compacto': compacto }" @click.stop>
    <button
      type="button"
      class="share__btn"
      :class="{ 'has-files': nArchivos }"
      :aria-label="`Foto de la factura ${numeroFactura(factura)}${nArchivos ? `, ${nArchivos} archivos` : ''}`"
      :title="nArchivos ? `Ver foto de la factura (${nArchivos})` : 'Subir foto de la factura'"
      @click="emit('adjuntos', factura)"
    >
      <i class="fa-solid fa-paperclip"></i>
      <span>{{ nArchivos ? `Factura (${nArchivos})` : 'Foto factura' }}</span>
      <b v-if="nArchivos" class="share__n" aria-hidden="true">{{ nArchivos }}</b>
    </button>
    <button
      type="button"
      class="share__btn is-wa"
      :aria-label="`Compartir factura ${numeroFactura(factura)} por WhatsApp`"
      title="Compartir por WhatsApp"
      @click="waOpen = true"
    >
      <i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span>
    </button>
    <button
      type="button"
      class="share__btn"
      :aria-label="`Enviar factura ${numeroFactura(factura)} por correo`"
      title="Enviar por correo"
      @click="emit('correo', factura)"
    >
      <i class="fa-solid fa-envelope"></i><span>Correo</span>
    </button>

    <WhatsAppOpciones :open="waOpen" :factura="factura" @close="waOpen = false" />
  </div>
</template>

<style lang="scss" scoped>
.share {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;

  &__btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 10px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-soft);
    font-family: $font-secondary;
    font-size: 0.72rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;

    i { font-size: 0.9rem; }
    &:hover { border-color: $primary; color: $primary; }
    &.has-files { border-color: rgba($primary, 0.5); color: $primary; background: var(--accent-soft); }
    &.is-wa { color: #128c4b; &:hover { border-color: #25d366; background: rgba(#25d366, 0.08); } }
  }

  &__n { display: none; }

  &.is-compacto {
    justify-content: center;

    .share__btn { width: 36px; padding: 0; span { display: none; } }

    .share__n {
      display: flex; align-items: center; justify-content: center;
      position: absolute; top: -6px; right: -6px; min-width: 17px; height: 17px; padding: 0 4px;
      border-radius: 999px; background: $primary; color: $white; font-size: 0.62rem; font-weight: 800;
    }
  }
}
</style>
