<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import { erpService } from '@/services/erp.service'
import { formatQty } from '@/utils/format'
import type { InventarioDisponible } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * Consulta rápida para el asesor en la calle: SOLO lo que sí hay para
 * facturar, sin el resto del inventario. Se puede compartir por WhatsApp
 * o descargar como imagen.
 */
const items = ref<InventarioDisponible[]>([])
const loading = ref(false)
const error = ref('')
const fetchedAt = ref<number | null>(null)

async function cargar() {
  loading.value = true
  error.value = ''
  try {
    items.value = await erpService.getInventarioDisponible()
    fetchedAt.value = Date.now()
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo consultar las existencias'
  } finally {
    loading.value = false
  }
}
onMounted(cargar)

/** Solo lo que sí hay: disponible real (reserva ya descontada) mayor a cero. */
const conStock = computed(() => items.value.filter((i) => Number(i.disponible) > 0))

const bodega = ref('todas')
const bodegas = computed(() => [...new Set(conStock.value.map((i) => i.bod_nombre))].sort())

const buscar = ref('')
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const lista = computed(() => {
  const q = normalizar(buscar.value.trim())
  return conStock.value
    .filter((i) => bodega.value === 'todas' || i.bod_nombre === bodega.value)
    .filter((i) => !q || normalizar(i.pro_nombre).includes(q))
    .sort((a, b) => a.pro_nombre.localeCompare(b.pro_nombre) || a.bod_nombre.localeCompare(b.bod_nombre))
})

/** Agrupado por bodega para pintar, compartir y armar la imagen. */
const grupos = computed(() => {
  const m = new Map<string, InventarioDisponible[]>()
  for (const i of lista.value) {
    const g = m.get(i.bod_nombre) || []
    g.push(i)
    m.set(i.bod_nombre, g)
  }
  return [...m.entries()].map(([nombre, productos]) => ({ nombre, productos }))
})

const sacosDe = (i: InventarioDisponible) =>
  Number(i.libras_por_saco) > 0 ? Math.floor(i.disponible / Number(i.libras_por_saco)) : null

const lineaTexto = (i: InventarioDisponible) => {
  const sacos = sacosDe(i)
  return `• ${i.pro_nombre}: ${formatQty(i.disponible)} ${i.uni_nombre}${sacos ? ` (≈ ${formatQty(sacos)} sacos)` : ''}`
}

const fechaTexto = () =>
  new Date().toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function textoCompartir(): string {
  const partes = [`*Existencias Importadora Tapia*`, `_${fechaTexto()}_`, '']
  for (const g of grupos.value) {
    partes.push(`*${g.nombre}*`)
    for (const i of g.productos) partes.push(lineaTexto(i))
    partes.push('')
  }
  return partes.join('\n').trim()
}

const compartido = ref(false)
async function compartir() {
  const text = textoCompartir()
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return
    }
  } catch {
    return // canceló el share
  }
  try {
    await navigator.clipboard.writeText(text)
    compartido.value = true
    setTimeout(() => (compartido.value = false), 2000)
  } catch { /* sin clipboard no hay fallback */ }
}

/** Imagen limpia para mandar al grupo: solo lo que sí hay, por bodega. */
const generando = ref(false)
async function descargarImagen() {
  if (generando.value || !grupos.value.length) return
  generando.value = true
  try {
    const W = 1080
    const pad = 56
    const filas = lista.value.length + grupos.value.length
    const H = 240 + filas * 72 + grupos.value.length * 28 + 90
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#F4F7FB'
    ctx.fillRect(0, 0, W, H)

    // Cabecera con la marca
    ctx.fillStyle = '#010D27'
    ctx.fillRect(0, 0, W, 160)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '800 44px system-ui, -apple-system, sans-serif'
    ctx.fillText('Importadora Tapia · Existencias', pad, 78)
    ctx.fillStyle = '#9DB2CE'
    ctx.font = '400 30px system-ui, -apple-system, sans-serif'
    ctx.fillText(`Disponible para facturar · ${fechaTexto()}`, pad, 126)

    let y = 230
    for (const g of grupos.value) {
      ctx.fillStyle = '#2094D2'
      ctx.font = '800 32px system-ui, -apple-system, sans-serif'
      ctx.fillText(g.nombre.toUpperCase(), pad, y)
      y += 28
      for (const i of g.productos) {
        ctx.fillStyle = '#FFFFFF'
        roundRect(ctx, pad - 16, y - 8, W - 2 * (pad - 16), 60, 12)
        ctx.fill()
        ctx.fillStyle = '#0A1430'
        ctx.font = '700 32px system-ui, -apple-system, sans-serif'
        ctx.fillText(acortar(ctx, i.pro_nombre, W - 2 * pad - 330), pad, y + 33)
        const sacos = sacosDe(i)
        const qty = `${formatQty(i.disponible)} ${i.uni_nombre}${sacos ? ` · ${formatQty(sacos)} sacos` : ''}`
        ctx.font = '800 30px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = '#1B7FB5'
        ctx.textAlign = 'right'
        ctx.fillText(qty, W - pad, y + 33)
        ctx.textAlign = 'left'
        y += 72
      }
      y += 28
    }
    ctx.fillStyle = '#8593B0'
    ctx.font = '400 24px system-ui, -apple-system, sans-serif'
    ctx.fillText('Generado desde el CRM · las cantidades pueden cambiar al facturar', pad, H - 36)

    const blob: Blob = await new Promise((ok, no) =>
      canvas.toBlob((b) => (b ? ok(b) : no(new Error('sin imagen'))), 'image/png'),
    )
    const archivo = new File([blob], `existencias-${new Date().toISOString().slice(0, 10)}.png`, { type: 'image/png' })
    // En el celular abre el share (WhatsApp directo); si no se puede, descarga.
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo] })
        return
      } catch { /* canceló: no descargar encima */ return }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = archivo.name
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    generando.value = false
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function acortar(ctx: CanvasRenderingContext2D, texto: string, maxW: number): string {
  if (ctx.measureText(texto).width <= maxW) return texto
  let t = texto
  while (t.length > 3 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1)
  return `${t}…`
}
</script>

<template>
  <div>
    <PageHeader
      title="Existencias"
      subtitle="Solo lo que sí hay para facturar, listo para compartir."
      source="erp"
      :updated-at="fetchedAt"
      :count="fetchedAt ? lista.length : null"
      :refreshing="loading && !!fetchedAt"
      @refresh="cargar"
    >
      <template #actions>
        <div class="acciones">
          <button type="button" class="accion" :disabled="!grupos.length" @click="compartir">
            <i class="fa-solid" :class="compartido ? 'fa-check' : 'fa-share-nodes'"></i>
            {{ compartido ? 'Copiado' : 'Compartir' }}
          </button>
          <button type="button" class="accion accion--img" :disabled="!grupos.length || generando" @click="descargarImagen">
            <i class="fa-solid" :class="generando ? 'fa-spinner fa-spin' : 'fa-image'"></i>
            Imagen
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="chips">
      <button type="button" class="chips__chip" :class="{ 'is-active': bodega === 'todas' }" @click="bodega = 'todas'">
        Todas
      </button>
      <button
        v-for="b in bodegas"
        :key="b"
        type="button"
        class="chips__chip"
        :class="{ 'is-active': bodega === b }"
        @click="bodega = b"
      >
        {{ b.replace('Bodega ', '') }}
      </button>
    </div>

    <div class="buscador">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input v-model="buscar" type="search" placeholder="Buscar producto…" />
    </div>

    <SkeletonTable v-if="loading && !fetchedAt" :cols="2" :rows="6" />
    <EmptyState v-else-if="error" tone="error" title="No se pudo cargar" :message="error" @retry="cargar" />
    <EmptyState
      v-else-if="!conStock.length"
      title="Nada disponible ahora"
      message="Ningún producto tiene stock libre para facturar en este momento."
    />
    <EmptyState v-else-if="!lista.length" title="Sin resultados" message="Prueba con otra bodega u otro nombre." />

    <template v-else>
      <section v-for="g in grupos" :key="g.nombre" class="grupo">
        <h2 class="grupo__titulo">{{ g.nombre }} <span>{{ g.productos.length }}</span></h2>
        <ul class="grupo__lista">
          <li v-for="i in g.productos" :key="i.pro_codigo + i.bod_nombre" class="prod">
            <strong class="prod__nombre">{{ i.pro_nombre }}</strong>
            <span class="prod__qty">
              <b>{{ formatQty(i.disponible) }}</b> {{ i.uni_nombre }}
              <small v-if="sacosDe(i)">≈ {{ formatQty(sacosDe(i)!) }} sacos</small>
            </span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.acciones { display: flex; gap: 8px; }
.accion {
  display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 16px;
  border: 1px solid var(--border-strong); border-radius: 8px; background: var(--surface);
  font-family: $font-principal; font-size: 0.8rem; font-weight: 700; color: var(--text); cursor: pointer;
  &:hover:not(:disabled) { border-color: $primary; color: $primary; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &--img { border: none; background: $primary; color: $white;
    &:hover:not(:disabled) { background: darken($primary, 6%); color: $white; } }
}

.chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;
  &__chip {
    min-height: 38px; padding: 0 14px; border: 1px solid var(--border-strong); border-radius: 999px;
    background: var(--surface); font-family: $font-secondary; font-size: 0.76rem; font-weight: 600;
    color: var(--text-soft); cursor: pointer; transition: all 0.2s ease;
    &:hover { border-color: $primary; color: $primary; }
    &.is-active { background: $primary; border-color: $primary; color: $white; box-shadow: 0 3px 10px rgba($primary, 0.3); }
  }
}

.buscador {
  display: flex; align-items: center; gap: 8px; padding: 0 14px; margin-bottom: 16px;
  border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--text-faint);
  input { flex: 1; min-height: 46px; border: none; background: transparent;
    font-family: $font-secondary; font-size: 0.9rem; color: var(--text);
    &:focus { outline: none; } }
}

.grupo {
  margin-bottom: 20px;
  &__titulo {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: $primary;
    span { font-family: $font-secondary; font-size: 0.68rem; font-weight: 700; padding: 1px 8px;
      border-radius: 999px; background: var(--accent-soft); }
  }
  &__lista { list-style: none; display: flex; flex-direction: column; gap: 8px; }
}

.prod {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 16px;
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-card);
  &__nombre { font-size: 0.88rem; font-weight: 700; color: var(--text); min-width: 0; overflow-wrap: anywhere; }
  &__qty { flex-shrink: 0; text-align: right; font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft);
    b { font-size: 1rem; font-weight: 800; color: darken($secondary, 10%); }
    small { display: block; font-size: 0.66rem; color: var(--text-faint); } }
}
</style>
