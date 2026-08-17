<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch, useSlots } from 'vue'
import SkeletonTable from './SkeletonTable.vue'
import EmptyState from './EmptyState.vue'
import TablePagination from './TablePagination.vue'
import TableToolbar from './TableToolbar.vue'

export interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  width?: string
}

const props = withDefaults(
  defineProps<{
    columns: Column[]
    rows: T[]
    loading?: boolean
    error?: string | null
    searchKeys?: string[]
    searchPlaceholder?: string
    pageSize?: number
    clickableRows?: boolean
  }>(),
  {
    loading: false,
    error: null,
    searchKeys: () => [],
    searchPlaceholder: 'Buscar…',
    pageSize: 15,
    clickableRows: false,
  },
)

defineEmits<{ retry: []; 'row-click': [row: T] }>()

const search = ref('')
const page = ref(1)
const sortKey = ref('')
const sortDir = ref<1 | -1>(1)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q || !props.searchKeys.length) return props.rows
  return props.rows.filter((row) =>
    props.searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
  )
})

const sorted = computed(() => {
  if (!sortKey.value) return filtered.value
  const key = sortKey.value
  return [...filtered.value].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    const an = Number(av)
    const bn = Number(bv)
    if (Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * sortDir.value
    return String(av ?? '').localeCompare(String(bv ?? ''), 'es') * sortDir.value
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / props.pageSize)))
const paged = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return sorted.value.slice(start, start + props.pageSize)
})

watch([search, () => props.rows], () => (page.value = 1))
watch(totalPages, (t) => {
  if (page.value > t) page.value = t
})

/** Con slot `mobile-card`, en pantallas chicas la tabla se vuelve lista de tarjetas. */
const slots = useSlots()
const hasMobileCards = computed(() => !!slots['mobile-card'])

function toggleSort(col: Column) {
  if (!col.sortable) return
  if (sortKey.value === col.key) {
    sortDir.value = sortDir.value === 1 ? -1 : 1
  } else {
    sortKey.value = col.key
    sortDir.value = 1
  }
}
</script>

<template>
  <section class="table-card">
    <TableToolbar
      v-if="searchKeys.length"
      v-model="search"
      :placeholder="searchPlaceholder"
      :meta="`${filtered.length.toLocaleString('es-EC')} registros`"
      :show-meta="!loading"
    />

    <SkeletonTable v-if="loading" :cols="columns.length" :rows="pageSize > 10 ? 10 : pageSize" />

    <EmptyState
      v-else-if="error"
      tone="error"
      title="No se pudo cargar"
      :message="error"
      @retry="$emit('retry')"
    />

    <EmptyState v-else-if="!filtered.length" />

    <template v-else>
    <ul v-if="hasMobileCards" class="table-card__cards" :key="`m${page}-${search}`">
      <li
        v-for="(row, i) in paged"
        :key="i"
        class="stagger-item"
        :class="{ 'is-clickable': clickableRows }"
        :style="{ '--i': i }"
        @click="clickableRows && $emit('row-click', row)"
      >
        <slot name="mobile-card" :row="row" />
      </li>
    </ul>

    <div class="table-card__scroll" :class="{ 'has-cards': hasMobileCards }">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[`is-${col.align || 'left'}`, { 'is-sortable': col.sortable }]"
              :style="col.width ? { width: col.width } : undefined"
              @click="toggleSort(col)"
            >
              <span>
                {{ col.label }}
                <i
                  v-if="col.sortable"
                  class="fa-solid fa-chevron-up sort-icon"
                  :class="{ 'is-active': sortKey === col.key, 'is-desc': sortKey === col.key && sortDir === -1 }"
                ></i>
              </span>
            </th>
          </tr>
        </thead>
        <tbody :key="`${page}-${search}-${sortKey}-${sortDir}`">
          <tr
            v-for="(row, i) in paged"
            :key="i"
            class="stagger-item"
            :class="{ 'is-clickable': clickableRows }"
            :style="{ '--i': i }"
            @click="clickableRows && $emit('row-click', row)"
          >
            <td v-for="col in columns" :key="col.key" :class="`is-${col.align || 'left'}`">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </template>

    <TablePagination
      v-if="!loading && !error && totalPages > 1"
      :page="page"
      :total-pages="totalPages"
      @prev="page--"
      @next="page++"
    />
  </section>
</template>

<style lang="scss" scoped>
.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  overflow: hidden;

  &__cards {
    display: none;
    list-style: none;

    li {
      border-bottom: 1px solid var(--border);
      padding: 14px 16px;

      &:last-child {
        border-bottom: none;
      }
    }

    @media (max-width: 640px) {
      display: block;
    }
  }

  &__scroll {
    overflow-x: auto;

    &.has-cards {
      @media (max-width: 640px) {
        display: none;
      }
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: $font-secondary;
    font-size: 0.84rem;
  }

  th {
    padding: 12px 20px;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-soft);
    background: rgba($primary-dark, 0.02);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    user-select: none;

    &.is-sortable {
      cursor: pointer;
      &:hover { color: $primary; }
    }

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }

  .sort-icon {
    font-size: 0.62rem;
    opacity: 0.3;
    transition: opacity 0.2s ease, transform 0.2s var(--ease-out);

    &.is-active { opacity: 1; color: $primary; }
    &.is-desc { transform: rotate(180deg); }
  }

  td {
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  tbody tr {
    transition: background 0.15s ease;
    &:hover { background: rgba($primary, 0.035); }
    &:last-child td { border-bottom: none; }

    &.is-clickable {
      cursor: pointer;
      &:hover { background: rgba($primary, 0.07); }
    }
  }

  &__cards li.is-clickable {
    cursor: pointer;
    transition: background 0.15s ease;
    &:active { background: rgba($primary, 0.07); }
  }

  .is-right { text-align: right; }
  .is-center { text-align: center; }
}
</style>
