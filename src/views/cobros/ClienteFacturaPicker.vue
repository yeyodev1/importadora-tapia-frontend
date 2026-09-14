<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useErpStore } from '@/stores/erp'
import { formatMoney } from '@/utils/format'
import { numeroFactura } from '@/utils/compartirFactura'
import { etiquetaEstado } from '@/utils/cartera'
import type { Cliente, FacturaCartera } from '@/types/erp'

/**
 * Cliente (solo de la cartera del ERP, nunca texto libre) y, opcional,
 * la factura pendiente que paga el cobro.
 */
const props = defineProps<{ /** Viene fijo desde la ficha del cliente. */ fijo?: boolean }>()
const codigo = defineModel<string>('codigo', { default: '' })
const nombre = defineModel<string>('nombre', { default: '' })
const factura = defineModel<string>('factura', { default: '' })
const emit = defineEmits<{ saldo: [n: number] }>()

const erp = useErpStore()
onMounted(() => {
  erp.fetchClientes()
  erp.fetchCarteraFacturas()
})

const filtro = ref('')
const resultados = computed(() => {
  const q = filtro.value.trim().toLowerCase()
  if (!q) return []
  return erp.clientes.data
    .filter((c) => c.per_nombre.toLowerCase().includes(q) || String(c.per_identificacion || '').includes(q))
    .slice(0, 8)
})

function elegir(c: Cliente) {
  codigo.value = c.per_codigo
  nombre.value = c.per_nombre
  factura.value = ''
  filtro.value = ''
}

function cambiar() {
  codigo.value = ''
  nombre.value = ''
  factura.value = ''
}

const facturas = computed(() =>
  nombre.value
    ? erp.carteraFacturas.data
        .filter((f) => f.per_nombre === nombre.value && Number(f.saldo_pendiente) > 0)
        .sort((a, b) => a.trc_fecha.localeCompare(b.trc_fecha))
    : [],
)

function elegirFactura(f: FacturaCartera) {
  const n = numeroFactura(f)
  if (factura.value === n) {
    factura.value = ''
    return
  }
  factura.value = n
  emit('saldo', Number(f.saldo_pendiente))
}
</script>

<template>
  <div class="cfp">
    <div v-if="codigo" class="cfp__elegido">
      <i class="fa-solid fa-circle-check cfp__check" aria-hidden="true"></i>
      <span class="cfp__txt">
        <strong>{{ nombre }}</strong>
        <small>Código {{ codigo }}</small>
      </span>
      <button v-if="!props.fijo" type="button" class="cfp__cambiar" @click="cambiar">Cambiar</button>
    </div>

    <template v-else>
      <input
        id="cobro-buscar-cliente"
        v-model="filtro"
        type="search"
        class="cfp__buscar"
        placeholder="Busca el cliente por nombre o RUC/cédula…"
        autocomplete="off"
        aria-label="Buscar cliente"
      />
      <p v-if="erp.clientes.loading && !erp.clientes.data.length" class="cfp__msg"><BaseSpinner :size="12" /> Cargando clientes…</p>
      <p v-else-if="!filtro.trim()" class="cfp__msg">El cobro debe ser a un cliente que ya existe en tu cartera.</p>
      <p v-else-if="!resultados.length" class="cfp__msg is-warn">
        Ningún cliente coincide con "{{ filtro }}". Si es cliente nuevo, primero créalo con una solicitud de crédito.
      </p>
      <div v-else class="cfp__lista">
        <button v-for="c in resultados" :key="c.per_codigo" type="button" class="cfp__cli" @click="elegir(c)">
          <strong>{{ c.per_nombre }}</strong>
          <small>{{ c.per_identificacion }} · código {{ c.per_codigo }}</small>
        </button>
      </div>
    </template>

    <div v-if="codigo" class="cfp__facturas">
      <span class="cfp__label">Factura que paga <em>· opcional</em></span>
      <p v-if="erp.carteraFacturas.loading && !erp.carteraFacturas.data.length" class="cfp__msg"><BaseSpinner :size="12" /> Cargando facturas…</p>
      <p v-else-if="!facturas.length" class="cfp__msg">Este cliente no tiene facturas pendientes: el cobro queda como abono general.</p>
      <template v-else>
        <button
          type="button"
          class="cfp__fac"
          :class="{ 'is-active': !factura }"
          :aria-pressed="!factura"
          @click="factura = ''"
        >
          <strong>Sin factura específica</strong>
          <small>Abono general a la cuenta</small>
        </button>
        <button
          v-for="f in facturas"
          :key="f.trc_codigo"
          type="button"
          class="cfp__fac"
          :class="{ 'is-active': factura === numeroFactura(f) }"
          :aria-pressed="factura === numeroFactura(f)"
          @click="elegirFactura(f)"
        >
          <strong><i class="fa-solid fa-file-invoice" aria-hidden="true"></i> {{ numeroFactura(f) }} · saldo {{ formatMoney(f.saldo_pendiente) }}</strong>
          <small>{{ etiquetaEstado(f) }}</small>
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cfp {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__buscar {
    width: 100%; padding: 11px 12px; border: 1px solid var(--border-strong); border-radius: 9px;
    font-family: $font-secondary; font-size: 0.9rem; color: var(--text); background: var(--surface);
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
  }

  &__msg {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft);
    &.is-warn { color: darken($alert-warning, 25%); }
  }

  &__lista { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }

  &__cli, &__fac {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px; width: 100%; min-height: 48px;
    padding: 9px 12px; border: 1px solid var(--border-strong); border-radius: 9px; background: var(--surface);
    text-align: left; cursor: pointer;
    strong { font-size: 0.84rem; font-weight: 700; color: var(--text); }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-faint); }
    &:hover { border-color: $primary; }
  }

  &__fac.is-active { border-color: $primary; background: var(--accent-soft); }

  &__elegido {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border: 1.5px solid rgba($secondary, 0.6); border-radius: 10px; background: rgba($secondary, 0.06);
  }
  &__check { font-size: 1.1rem; color: darken($secondary, 8%); }
  &__txt {
    flex: 1; min-width: 0; display: flex; flex-direction: column;
    strong { font-size: 0.88rem; font-weight: 800; }
    small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-soft); }
  }
  &__cambiar {
    min-height: 40px; padding: 0 12px; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--surface);
    font-family: $font-secondary; font-size: 0.76rem; font-weight: 700; color: var(--text); cursor: pointer;
    &:hover { border-color: $primary; color: $primary; }
  }

  &__facturas { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
  &__label {
    font-family: $font-secondary; font-size: 0.74rem; font-weight: 600; color: var(--text-soft);
    em { font-style: normal; font-weight: 400; color: var(--text-faint); }
  }
}
</style>
