<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useErpStore } from '@/stores/erp'
import { erpService } from '@/services/erp.service'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import type { Vendedor, AsignacionInventario } from '@/types/erp'
import type { ApiError } from '@/types'

/**
 * El admin decide qué inventario ve un vendedor: todo (por defecto) o sólo
 * los productos marcados. Es opcional: si no se toca, ve todo.
 */
const props = defineProps<{ open: boolean; vendedor: Vendedor | null; actual: AsignacionInventario | null }>()
const emit = defineEmits<{ close: []; saved: [asignacion: AsignacionInventario] }>()

const erp = useErpStore()

const restringido = ref(false)
const seleccion = ref<Set<string>>(new Set())
const buscar = ref('')
const saving = ref(false)
const error = ref('')

watch(
  () => props.open,
  (o) => {
    if (!o) return
    erp.fetchInventario()
    error.value = ''
    buscar.value = ''
    restringido.value = Boolean(props.actual?.restringido)
    seleccion.value = new Set(props.actual?.productos || [])
  },
)

/** Productos únicos del ERP (el inventario viene por bodega). */
const productos = computed(() => {
  const map = new Map<string, { codigo: string; nombre: string; unidad: string }>()
  for (const i of erp.inventario.data) {
    if (!map.has(i.pro_codigo)) map.set(i.pro_codigo, { codigo: i.pro_codigo, nombre: i.pro_nombre, unidad: i.uni_nombre })
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
})

const visibles = computed(() => {
  const q = buscar.value.trim().toLowerCase()
  if (!q) return productos.value
  return productos.value.filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q))
})

function toggle(codigo: string) {
  const next = new Set(seleccion.value)
  if (next.has(codigo)) next.delete(codigo)
  else next.add(codigo)
  seleccion.value = next
}

function marcarVisibles(marcar: boolean) {
  const next = new Set(seleccion.value)
  for (const p of visibles.value) marcar ? next.add(p.codigo) : next.delete(p.codigo)
  seleccion.value = next
}

const puedeGuardar = computed(() => !saving.value && (!restringido.value || seleccion.value.size > 0))

async function guardar() {
  if (!props.vendedor || !puedeGuardar.value) return
  saving.value = true
  error.value = ''
  try {
    const a = await erpService.guardarAsignacionInventario(props.vendedor.ven_codigo, {
      restringido: restringido.value,
      productos: restringido.value ? [...seleccion.value] : [],
    })
    emit('saved', a)
    emit('close')
  } catch (err) {
    error.value = (err as ApiError)?.message || 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open && vendedor" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true">
          <header class="modal__head">
            <div>
              <h2>Inventario de {{ vendedor.ven_nombre }}</h2>
              <p class="modal__hint">Elige qué productos puede ver y vender este vendedor. Si no lo limitas, ve todo el inventario.</p>
            </div>
            <button type="button" class="modal__x" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </header>

          <div class="modos">
            <button type="button" class="modo" :class="{ 'is-active': !restringido }" @click="restringido = false">
              <i class="fa-solid fa-boxes-stacked"></i>
              <strong>Todo el inventario</strong>
              <small>Ve y vende cualquier producto del ERP.</small>
            </button>
            <button type="button" class="modo" :class="{ 'is-active': restringido }" @click="restringido = true">
              <i class="fa-solid fa-filter"></i>
              <strong>Solo lo asignado</strong>
              <small>Ve únicamente los productos que marques abajo.</small>
            </button>
          </div>

          <div v-if="restringido" class="picker">
            <div class="picker__bar">
              <input v-model="buscar" type="search" placeholder="Buscar producto por nombre o código…" aria-label="Buscar producto" />
              <span class="picker__count"><b>{{ seleccion.size }}</b> de {{ productos.length }} marcados</span>
            </div>
            <div class="picker__acciones">
              <button type="button" class="link" @click="marcarVisibles(true)">Marcar los {{ visibles.length }} visibles</button>
              <button type="button" class="link" @click="marcarVisibles(false)">Desmarcar visibles</button>
              <button type="button" class="link" @click="seleccion = new Set()">Limpiar todo</button>
            </div>
            <p v-if="erp.inventario.loading && !erp.inventario.fetchedAt" class="estado"><BaseSpinner :size="12" /> Cargando inventario…</p>
            <div v-else class="picker__list">
              <button
                v-for="p in visibles"
                :key="p.codigo"
                type="button"
                class="prod"
                :class="{ 'is-on': seleccion.has(p.codigo) }"
                :aria-pressed="seleccion.has(p.codigo)"
                @click="toggle(p.codigo)"
              >
                <span class="prod__check"><i class="fa-solid fa-check"></i></span>
                <span class="prod__name">{{ p.nombre }}</span>
                <span class="prod__code">{{ p.codigo }} · {{ p.unidad }}</span>
              </button>
              <p v-if="!visibles.length" class="estado">Ningún producto coincide con "{{ buscar }}".</p>
            </div>
          </div>

          <p v-if="error" class="modal__error" role="alert">{{ error }}</p>

          <div class="modal__actions">
            <div class="modal__btns">
              <button type="button" class="modal__cancel" @click="emit('close')">Cancelar</button>
              <button type="button" class="modal__save" :disabled="!puedeGuardar" @click="guardar">
                <BaseSpinner v-if="saving" :size="14" light />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '@/views/equipo/form-modal';

.modal { max-width: 620px; }

.modos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  @media (min-width: 560px) { flex-direction: row; > * { flex: 1 1 0; } }
}

.modo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px 14px;
  border: 1.5px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  i { color: var(--text-faint); margin-bottom: 4px; }
  strong { font-size: 0.86rem; font-weight: 800; color: var(--text); }
  small { font-family: $font-secondary; font-size: 0.7rem; color: var(--text-soft); }
  &:hover { border-color: $primary; }
  &.is-active { border-color: $primary; background: var(--accent-soft); i { color: $primary; } }
}

.picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;

  &__bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    @media (min-width: 560px) { flex-direction: row; align-items: center; }
    input {
      flex: 1;
      min-height: 42px;
      padding: 8px 12px;
      border: 1px solid var(--border-strong);
      border-radius: 9px;
      font-family: $font-secondary;
      font-size: 0.84rem;
      color: var(--text);
      background: var(--surface);
      &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
    }
  }

  &__count { font-family: $font-secondary; font-size: 0.76rem; color: var(--text-soft); white-space: nowrap; b { color: $primary; } }
  &__acciones { display: flex; flex-wrap: wrap; gap: 14px; }
  &__list { display: flex; flex-direction: column; gap: 6px; max-height: 42vh; overflow-y: auto; padding-right: 2px; }
}

.link { background: none; border: none; padding: 0; color: $primary; font: inherit; font-size: 0.76rem; font-weight: 700; cursor: pointer; &:hover { text-decoration: underline; } }
.estado { display: flex; align-items: center; gap: 8px; font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft); }

.prod {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;

  &__check {
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid var(--border-strong);
    color: transparent; font-size: 0.7rem;
  }
  &__name { flex: 1; min-width: 0; font-size: 0.82rem; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__code { flex-shrink: 0; font-family: $font-secondary; font-size: 0.68rem; color: var(--text-faint); }

  &:hover { border-color: $primary; }
  &.is-on { border-color: $primary; background: var(--accent-soft); .prod__check { background: $primary; border-color: $primary; color: $white; } }
}
</style>
