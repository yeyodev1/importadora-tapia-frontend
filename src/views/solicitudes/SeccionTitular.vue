<script setup lang="ts">
import { computed, ref } from 'vue'
import RouteMap from '@/components/ui/RouteMap.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useErpStore } from '@/stores/erp'
import { obtenerUbicacion } from '@/utils/geo'
import { PERSONA_LABEL } from './documentos'
import type { SolicitudDatos, TipoPersona } from '@/types/solicitudes'

const props = defineProps<{ datos: SolicitudDatos; disabled: boolean }>()
const erp = useErpStore()

const PERSONAS: { v: TipoPersona; desc: string }[] = [
  { v: 'natural', desc: 'Sin RUC o sin contabilidad' },
  { v: 'obligado', desc: 'Negocio con RUC que lleva contabilidad' },
  { v: 'juridica', desc: 'Compañía con representante legal' },
]
const FORMAS = ['Contado', 'Crédito', 'Cheque', 'Transferencia']

/** GPS opcional: el vendedor lo toma parado en el local del cliente. */
const ubicando = ref(false)
const errorGps = ref('')
async function tomarUbicacion() {
  ubicando.value = true
  errorGps.value = ''
  try {
    props.datos.ubicacion = await obtenerUbicacion()
  } catch (err) {
    errorGps.value = (err as Error).message
  } finally {
    ubicando.value = false
  }
}
const paradas = computed(() =>
  props.datos.ubicacion ? [{ ...props.datos.ubicacion, label: props.datos.negocio.nombre || 'Negocio', hora: '' }] : [],
)

const digitos = (x: string | null | undefined) => String(x || '').replace(/\D/g, '')

/** Cliente "nuevo" cuya cédula o RUC ya está en el ERP: debería ser una actualización. */
const yaExiste = computed(() => {
  if (props.datos.tipo !== 'nuevo') return null
  const ids = [props.datos.titular.cedula, props.datos.negocio.ruc]
    .map((x) => digitos(x).slice(0, 10))
    .filter((x) => x.length === 10)
  if (!ids.length) return null
  return erp.clientes.data.find((c) => ids.includes(digitos(c.per_identificacion).slice(0, 10))) || null
})
</script>

<template>
  <section class="bloque">
    <header class="bloque__head">
      <h2>Datos principales del cliente</h2>
      <p>Los mismos datos de la hoja de solicitud de crédito.</p>
    </header>

    <div class="fld">
      <span>Tipo de persona <em>*</em></span>
      <div class="personas" role="radiogroup" aria-label="Tipo de persona">
        <button
          v-for="p in PERSONAS"
          :key="p.v"
          type="button"
          role="radio"
          class="persona"
          :class="{ 'is-active': datos.tipoPersona === p.v }"
          :aria-checked="datos.tipoPersona === p.v"
          :disabled="disabled"
          @click="datos.tipoPersona = p.v"
        >
          <strong>{{ PERSONA_LABEL[p.v] }}</strong>
          <small>{{ p.desc }}</small>
        </button>
      </div>
    </div>

    <div class="fila">
      <label class="fld"><span>Nombres <em>*</em></span>
        <input id="sol-nombres" v-model="datos.titular.nombres" type="text" autocomplete="off" :disabled="disabled" />
      </label>
      <label class="fld"><span>Apellidos <em>*</em></span>
        <input id="sol-apellidos" v-model="datos.titular.apellidos" type="text" autocomplete="off" :disabled="disabled" />
      </label>
    </div>

    <label class="fld"><span>Cédula de identidad <em>*</em></span>
      <input id="sol-cedula" v-model.trim="datos.titular.cedula" type="text" inputmode="numeric" pattern="\d{10}" maxlength="10" :disabled="disabled" />
    </label>

    <div class="fld">
      <span>Forma de pago <em>*</em></span>
      <div class="chips" role="radiogroup" aria-label="Forma de pago">
        <button
          v-for="f in FORMAS"
          :key="f"
          type="button"
          role="radio"
          class="chip"
          :class="{ 'is-active': datos.titular.formaPago === f }"
          :aria-checked="datos.titular.formaPago === f"
          :disabled="disabled"
          @click="datos.titular.formaPago = f"
        >{{ f }}</button>
      </div>
    </div>

    <p class="sub">Información básica del negocio</p>

    <div class="fila">
      <label class="fld"><span>Nombre del negocio <em>*</em></span>
        <input id="sol-negocio" v-model="datos.negocio.nombre" type="text" :disabled="disabled" />
      </label>
      <label class="fld"><span>N.º de RUC <em v-if="datos.tipoPersona !== 'natural'">*</em></span>
        <input id="sol-ruc" v-model.trim="datos.negocio.ruc" type="text" inputmode="numeric" pattern="\d{13}" maxlength="13" :disabled="disabled" />
      </label>
    </div>

    <label class="fld"><span>Dirección del negocio <em>*</em></span>
      <input id="sol-dir-negocio" v-model="datos.negocio.direccion" type="text" :disabled="disabled" />
    </label>

    <div class="fila">
      <label class="fld"><span>Teléfono del negocio</span>
        <input id="sol-tel-negocio" v-model="datos.negocio.telefono" type="tel" :disabled="disabled" />
      </label>
      <label class="fld"><span>Número de celular <em>*</em></span>
        <input id="sol-celular" v-model="datos.negocio.celular" type="tel" :disabled="disabled" />
      </label>
    </div>

    <label class="fld"><span>Correo del cliente</span>
      <input
        id="sol-correo"
        v-model.trim="datos.negocio.correo"
        type="email"
        autocomplete="off"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        maxlength="120"
        :disabled="disabled"
      />
    </label>

    <div class="fld">
      <span>Ubicación del negocio (opcional)</span>
      <template v-if="datos.ubicacion">
        <RouteMap :paradas="paradas" class="mapa" />
        <small class="gps">
          {{ datos.ubicacion.lat.toFixed(5) }}, {{ datos.ubicacion.lng.toFixed(5) }} ·
          <a :href="`https://www.google.com/maps?q=${datos.ubicacion.lat},${datos.ubicacion.lng}`" target="_blank" rel="noopener">Abrir en Maps</a>
        </small>
      </template>
      <div v-if="!disabled" class="gps__btns">
        <button type="button" class="gps__btn" :disabled="ubicando" @click="tomarUbicacion">
          <BaseSpinner v-if="ubicando" :size="14" />
          <i v-else class="fa-solid fa-location-crosshairs"></i>
          {{ datos.ubicacion ? 'Volver a tomar' : 'Usar mi ubicación actual' }}
        </button>
        <button v-if="datos.ubicacion" type="button" class="gps__btn" @click="datos.ubicacion = null">Quitar</button>
      </div>
      <small v-if="!datos.ubicacion && !disabled" class="gps">Tómala estando en el local del cliente.</small>
      <p v-if="errorGps" class="aviso is-error" role="alert">{{ errorGps }}</p>
    </div>

    <div class="fila">
      <label class="fld"><span>Dirección del domicilio</span>
        <input id="sol-dir-domicilio" v-model="datos.negocio.direccionDomicilio" type="text" :disabled="disabled" />
      </label>
      <label class="fld"><span>Teléfono del domicilio</span>
        <input id="sol-tel-domicilio" v-model="datos.negocio.telefonoDomicilio" type="tel" :disabled="disabled" />
      </label>
    </div>

    <p v-if="yaExiste" class="aviso is-warn">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>
        Esta cédula o RUC ya está en el ERP como <b>{{ yaExiste.per_nombre }}</b> (código {{ yaExiste.per_codigo }}).
        Si es el mismo cliente, haz una <b>actualización de datos</b> desde su ficha.
      </span>
    </p>
  </section>
</template>

<style lang="scss" scoped>
@use './solicitud-form';

.fld .mapa { height: 200px; }
.gps {
  font-family: $font-secondary; font-size: 0.74rem; color: var(--text-soft);
  a { color: $primary; font-weight: 600; }
  &__btns { display: flex; gap: 8px; flex-wrap: wrap; }
  &__btn {
    display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 14px;
    border: 1px solid var(--border-strong); border-radius: 9px; background: var(--surface); color: var(--text);
    font-family: $font-principal; font-size: 0.8rem; font-weight: 700; cursor: pointer;
    &:hover:not(:disabled) { border-color: $primary; color: $primary; }
    &:disabled { opacity: 0.6; cursor: wait; }
  }
}

.personas {
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 640px) {
    flex-direction: row;
    > * { flex: 1 1 0; }
  }
}

.persona {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1.5px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  strong { font-size: 0.84rem; font-weight: 800; color: var(--text); }
  small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-soft); }
  &:hover:not(:disabled) { border-color: $primary; }
  &.is-active { border-color: $primary; background: var(--accent-soft); }
  &:disabled { cursor: default; }
}
</style>
