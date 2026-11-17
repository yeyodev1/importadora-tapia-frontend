<script setup lang="ts">
import { PLAZOS_CREDITO } from './documentos'
import type { SolicitudDatos } from '@/types/solicitudes'

/** ¿Solo alta del cliente o también crédito? Si es crédito: cupo y plazo. */
const props = defineProps<{ datos: SolicitudDatos; disabled: boolean }>()

const OPCIONES = [
  { v: false, label: 'Solo registrar cliente', desc: 'Compra de contado' },
  { v: true, label: 'Con solicitud de crédito', desc: 'Cupo, plazo, referencias y documentos' },
]

function cupo(e: Event) {
  const v = (e.target as HTMLInputElement).value.replace(',', '.').trim()
  props.datos.cupoSolicitado = v === '' ? null : Number(v)
}
</script>

<template>
  <section class="bloque">
    <header class="bloque__head">
      <h2>¿Qué necesita el cliente?</h2>
      <p>Administración lo revisa y da de alta en el ERP. Al aprobar o rechazar te llega un correo.</p>
    </header>

    <div class="opciones" role="radiogroup" aria-label="Tipo de solicitud">
      <button
        v-for="o in OPCIONES"
        :key="String(o.v)"
        type="button"
        role="radio"
        class="opcion"
        :class="{ 'is-active': datos.pideCredito === o.v }"
        :aria-checked="datos.pideCredito === o.v"
        :disabled="disabled"
        @click="datos.pideCredito = o.v"
      >
        <strong>{{ o.label }}</strong>
        <small>{{ o.desc }}</small>
      </button>
    </div>

    <template v-if="datos.pideCredito">
      <label class="fld" for="sol-cupo"><span>Cupo de crédito pedido (USD) <em>*</em></span>
        <input
          id="sol-cupo"
          :value="datos.cupoSolicitado ?? ''"
          type="text"
          inputmode="decimal"
          pattern="\d+([.,]\d{1,2})?"
          autocomplete="off"
          enterkeyhint="next"
          placeholder="Ej. 1500"
          :disabled="disabled"
          @input="cupo"
        />
      </label>

      <div class="fld">
        <span id="sol-plazo-label">Plazo de pago <em>*</em></span>
        <div class="chips" role="radiogroup" aria-labelledby="sol-plazo-label">
          <button
            v-for="d in PLAZOS_CREDITO"
            :key="d"
            type="button"
            role="radio"
            class="chip"
            :class="{ 'is-active': datos.plazoDias === d }"
            :aria-checked="datos.plazoDias === d"
            :disabled="disabled"
            @click="datos.plazoDias = d"
          >{{ d }} días</button>
        </div>
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
@use './solicitud-form';

.opciones {
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 640px) {
    flex-direction: row;
    > * { flex: 1 1 0; }
  }
}

.opcion {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 48px;
  padding: 10px 12px;
  border: 1.5px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  strong { font-size: 0.86rem; font-weight: 800; color: var(--text); }
  small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-soft); }
  &:hover:not(:disabled) { border-color: $primary; }
  &.is-active { border-color: $primary; background: var(--accent-soft); }
  &:disabled { cursor: default; }
}
</style>
