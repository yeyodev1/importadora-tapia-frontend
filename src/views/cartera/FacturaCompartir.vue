<script setup lang="ts">
import { textoFactura, urlWhatsApp, numeroFactura } from '@/utils/compartirFactura'
import type { FacturaCartera } from '@/types/erp'

/** Botones para compartir una factura: WhatsApp (elige el contacto) y correo. */
defineProps<{ factura: FacturaCartera; /** Solo íconos (dentro de la tabla de escritorio). */ compacto?: boolean }>()
const emit = defineEmits<{ correo: [f: FacturaCartera] }>()
</script>

<template>
  <div class="share" :class="{ 'is-compacto': compacto }" @click.stop>
    <a
      :href="urlWhatsApp(textoFactura(factura))"
      target="_blank"
      rel="noopener"
      class="share__btn is-wa"
      :aria-label="`Compartir factura ${numeroFactura(factura)} por WhatsApp`"
      title="Compartir por WhatsApp"
    >
      <i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span>
    </a>
    <button
      type="button"
      class="share__btn"
      :aria-label="`Enviar factura ${numeroFactura(factura)} por correo`"
      title="Enviar por correo"
      @click="emit('correo', factura)"
    >
      <i class="fa-solid fa-envelope"></i><span>Correo</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.share {
  display: flex;
  gap: 6px;
  justify-content: flex-end;

  &__btn {
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
    &.is-wa { color: #128c4b; &:hover { border-color: #25d366; background: rgba(#25d366, 0.08); } }

  }

  &.is-compacto {
    justify-content: center;
    .share__btn { width: 36px; padding: 0; span { display: none; } }
  }
}
</style>
