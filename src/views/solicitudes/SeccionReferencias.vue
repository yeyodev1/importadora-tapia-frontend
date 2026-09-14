<script setup lang="ts">
import type { SolicitudDatos } from '@/types/solicitudes'

defineProps<{ datos: SolicitudDatos; disabled: boolean }>()
</script>

<template>
  <section class="bloque">
    <header class="bloque__head">
      <h2>Referencias</h2>
      <p>Opcionales, pero ayudan a aprobar el crédito más rápido.</p>
    </header>

    <p class="sub">Referencias comerciales</p>
    <div v-for="(r, i) in datos.refComerciales" :key="`com-${i}`" class="ref">
      <span class="ref__n">Proveedor {{ i + 1 }}</span>
      <div class="fila">
        <label class="fld"><span>Nombre del proveedor</span>
          <input :id="`ref-com-prov-${i}`" v-model="r.proveedor" type="text" :disabled="disabled" />
        </label>
        <label class="fld"><span>Monto de compra al mes (USD)</span>
          <input :id="`ref-com-monto-${i}`" v-model="r.montoMes" type="text" inputmode="decimal" :disabled="disabled" />
        </label>
      </div>
      <div class="fila">
        <label class="fld"><span>Plazo de pago</span>
          <input :id="`ref-com-plazo-${i}`" v-model="r.plazoPago" type="text" placeholder="Ej.: 30 días" :disabled="disabled" />
        </label>
        <label class="fld"><span>Teléfono del proveedor</span>
          <input :id="`ref-com-tel-${i}`" v-model="r.telefono" type="tel" :disabled="disabled" />
        </label>
      </div>
    </div>

    <p class="sub">Referencias bancarias</p>
    <div v-for="(r, i) in datos.refBancarias" :key="`ban-${i}`" class="fila">
      <label class="fld"><span>Banco {{ i + 1 }}</span>
        <input :id="`ref-ban-banco-${i}`" v-model="r.banco" type="text" :disabled="disabled" />
      </label>
      <label class="fld"><span>N.º de cuenta corriente</span>
        <input :id="`ref-ban-cta-${i}`" v-model="r.cuenta" type="text" inputmode="numeric" :disabled="disabled" />
      </label>
    </div>

    <p class="sub">Referencias personales · familiares o amigos que no vivan con el cliente</p>
    <div v-for="(r, i) in datos.refPersonales" :key="`per-${i}`" class="ref">
      <span class="ref__n">Persona {{ i + 1 }}</span>
      <div class="fila">
        <label class="fld"><span>Nombres</span>
          <input :id="`ref-per-nom-${i}`" v-model="r.nombres" type="text" :disabled="disabled" />
        </label>
        <label class="fld"><span>Apellidos</span>
          <input :id="`ref-per-ape-${i}`" v-model="r.apellidos" type="text" :disabled="disabled" />
        </label>
      </div>
      <div class="fila">
        <label class="fld"><span>Parentesco</span>
          <input :id="`ref-per-par-${i}`" v-model="r.parentesco" type="text" :disabled="disabled" />
        </label>
        <label class="fld"><span>Teléfonos</span>
          <input :id="`ref-per-tel-${i}`" v-model="r.telefonos" type="tel" :disabled="disabled" />
        </label>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use './solicitud-form';

.ref {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px dashed var(--border-strong);
  border-radius: 10px;

  &__n {
    font-family: $font-secondary;
    font-size: 0.72rem;
    font-weight: 700;
    color: $primary;
  }
}
</style>
