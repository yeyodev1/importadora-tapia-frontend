<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{ change: [dataUrl: string | null] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false
let hasContent = false

function pos(e: PointerEvent) {
  const rect = canvas.value!.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function start(e: PointerEvent) {
  if (!ctx) return
  drawing = true
  hasContent = true
  const { x, y } = pos(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
  canvas.value!.setPointerCapture(e.pointerId)
}

function move(e: PointerEvent) {
  if (!drawing || !ctx) return
  const { x, y } = pos(e)
  ctx.lineTo(x, y)
  ctx.stroke()
}

function end() {
  if (!drawing) return
  drawing = false
  if (hasContent) emit('change', canvas.value!.toDataURL('image/png'))
}

function clear() {
  if (!ctx || !canvas.value) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  hasContent = false
  emit('change', null)
}

function setup() {
  const c = canvas.value
  if (!c) return
  // Escalar al DPR para trazo nítido en móvil.
  const rect = c.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  c.width = rect.width * dpr
  c.height = rect.height * dpr
  ctx = c.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0A1430'
  }
}

onMounted(setup)
onBeforeUnmount(() => (ctx = null))

defineExpose({ clear })
</script>

<template>
  <div class="sign">
    <canvas
      ref="canvas"
      class="sign__canvas"
      @pointerdown="start"
      @pointermove="move"
      @pointerup="end"
      @pointerleave="end"
    ></canvas>
    <button type="button" class="sign__clear" @click="clear">Borrar firma</button>
    <span class="sign__hint">Firma del cliente</span>
  </div>
</template>

<style lang="scss" scoped>
.sign {
  position: relative;
  border: 1.5px dashed var(--border-strong);
  border-radius: 11px;
  background:
    repeating-linear-gradient(transparent, transparent 27px, rgba($primary-dark, 0.05) 28px);
  overflow: hidden;

  &__canvas {
    display: block;
    width: 100%;
    height: 120px;
    touch-action: none;
    cursor: crosshair;
  }

  &__clear {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 5px 10px;
    border: 1px solid var(--border-strong);
    border-radius: 6px;
    background: var(--surface);
    font-family: $font-principal;
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--text-soft);
    cursor: pointer;

    &:hover {
      border-color: $alert-error;
      color: $alert-error;
    }
  }

  &__hint {
    position: absolute;
    bottom: 6px;
    left: 12px;
    font-family: $font-secondary;
    font-size: 0.68rem;
    color: var(--text-faint);
    pointer-events: none;
  }
}
</style>
