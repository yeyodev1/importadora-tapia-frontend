<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'
import SourceTag from '@/components/ui/SourceTag.vue'
import { formatMoney } from '@/utils/format'
import { esVencida } from '@/utils/cartera'
import type { FacturaCartera } from '@/types/erp'

const props = defineProps<{
  facturas: FacturaCartera[]
  deudaTotal: number
  maxFacturas: number
}>()

const abiertas = () => props.facturas.filter((f) => Number(f.saldo_pendiente) > 0)
const vencidas = () => abiertas().filter(esVencida)

function estado(): { tone: 'success' | 'warning' | 'danger'; label: string; detalle: string } {
  const a = abiertas().length
  const v = vencidas().length
  if (v > 0)
    return {
      tone: 'danger',
      label: 'Bloqueado · crédito vencido',
      detalle: `${v} factura${v > 1 ? 's' : ''} vencida${v > 1 ? 's' : ''} — cobrar antes de vender a crédito`,
    }
  if (a >= props.maxFacturas)
    return {
      tone: 'danger',
      label: 'Bloqueado · tope de facturas',
      detalle: `${a}/${props.maxFacturas} facturas abiertas — se desbloquea registrando un pago`,
    }
  if (a >= props.maxFacturas - 1)
    return {
      tone: 'warning',
      label: 'Por llegar al tope',
      detalle: `${a}/${props.maxFacturas} facturas abiertas — pedir respaldo en la próxima venta`,
    }
  return { tone: 'success', label: 'Habilitado para vender', detalle: `${a}/${props.maxFacturas} facturas abiertas` }
}

const totalFacturado = () => props.facturas.reduce((s, f) => s + Number(f.trc_totfact || 0), 0)
const totalAbonado = () => props.facturas.reduce((s, f) => s + Number(f.total_abonado || 0), 0)
const saldoVencido = () => vencidas().reduce((s, f) => s + Number(f.saldo_pendiente || 0), 0)
</script>

<template>
  <section class="credito">
    <div class="credito__estado">
      <BaseBadge :tone="estado().tone">{{ estado().label }}</BaseBadge>
      <p>{{ estado().detalle }}</p>
      <SourceTag source="erp" class="credito__fuente" />
    </div>

    <div class="credito__cifras">
      <div class="cifra">
        <span>Deuda total</span>
        <b :class="{ 'is-danger': deudaTotal > 0 }">{{ formatMoney(deudaTotal) }}</b>
      </div>
      <div class="cifra">
        <span>Saldo vencido</span>
        <b :class="{ 'is-danger': saldoVencido() > 0 }">{{ formatMoney(saldoVencido()) }}</b>
      </div>
      <div class="cifra">
        <span>Facturado (2 años)</span>
        <b>{{ formatMoney(totalFacturado()) }}</b>
      </div>
      <div class="cifra">
        <span>Abonado</span>
        <b class="is-positive">{{ formatMoney(totalAbonado()) }}</b>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.credito {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 18px 20px;

  &__estado {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);

    .credito__fuente {
      margin-left: auto;
    }

    p {
      font-family: $font-secondary;
      font-size: 0.78rem;
      color: var(--text-soft);
    }
  }

  &__cifras {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 14px;

    @media (max-width: 720px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .cifra {
    span {
      display: block;
      font-family: $font-secondary;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-faint);
    }

    b {
      display: block;
      margin-top: 4px;
      font-size: 1.05rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;

      &.is-danger {
        color: darken($alert-error, 8%);
      }

      &.is-positive {
        color: darken($secondary, 10%);
      }
    }
  }
}
</style>
