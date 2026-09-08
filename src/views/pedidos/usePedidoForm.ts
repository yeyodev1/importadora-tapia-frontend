import { ref, computed } from 'vue'
import { usePedidosStore } from '@/stores/pedidos'
import { erpService } from '@/services/erp.service'
import { formatQty } from '@/utils/format'
import type { InventarioDisponible } from '@/types/erp'
import type { ApiError } from '@/types'

export interface Linea {
  productoCodigo: string
  productoNombre: string
  unidad?: string
  bodega?: string
  disponible: number
  cantidad: number
  precioUnitario: number
}

/** Estado y reglas del formulario de pedido (el modal sólo pinta). */
export function usePedidoForm() {
  const pedidos = usePedidosStore()

  const cliente = ref('')
  const clienteCodigo = ref<string | undefined>(undefined)
  const observacion = ref('')
  /** Obligatorio: null hasta que el vendedor elija (0 = contado). */
  const plazoCreditoDias = ref<number | null>(null)
  const lineas = ref<Linea[]>([])
  const buscar = ref('')
  const foto = ref('')
  const saving = ref(false)
  const error = ref('')
  const inventario = ref<InventarioDisponible[]>([])
  const cargandoInv = ref(false)

  async function cargarInventario() {
    cargandoInv.value = true
    try {
      inventario.value = await erpService.getInventarioDisponible()
    } catch {
      inventario.value = []
    } finally {
      cargandoInv.value = false
    }
  }

  function reset(nombre = '', codigo?: string) {
    cargarInventario()
    error.value = ''
    cliente.value = nombre
    clienteCodigo.value = codigo
    observacion.value = ''
    plazoCreditoDias.value = null
    lineas.value = []
    buscar.value = ''
    foto.value = ''
  }

  const resultados = computed(() => {
    const q = buscar.value.trim().toLowerCase()
    if (!q) return []
    return inventario.value.filter((i) => i.pro_nombre.toLowerCase().includes(q)).slice(0, 6)
  })

  function agregar(item: InventarioDisponible) {
    const ya = lineas.value.find((l) => l.productoCodigo === item.pro_codigo && l.bodega === item.bod_nombre)
    if (ya) {
      if (ya.cantidad < ya.disponible) ya.cantidad += 1
    } else {
      lineas.value.push({
        productoCodigo: item.pro_codigo,
        productoNombre: item.pro_nombre,
        unidad: item.uni_nombre,
        bodega: item.bod_nombre,
        disponible: item.disponible,
        cantidad: 1,
        precioUnitario: 0,
      })
    }
    buscar.value = ''
  }

  function quitar(i: number) {
    lineas.value.splice(i, 1)
  }

  const total = computed(() => lineas.value.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0))

  /** Devuelve true si el pedido quedó enviado. */
  async function guardar(): Promise<boolean> {
    if (saving.value) return false
    error.value = ''
    if (!cliente.value) {
      error.value = 'Indica el cliente.'
      return false
    }
    if (plazoCreditoDias.value === null) {
      error.value = 'Elige el plazo de crédito del pedido (contado o días).'
      return false
    }
    if (!lineas.value.length) {
      error.value = 'Agrega al menos un producto.'
      return false
    }
    const sobreStock = lineas.value.find((l) => l.cantidad > l.disponible)
    if (sobreStock) {
      error.value = `${sobreStock.productoNombre}: pediste ${sobreStock.cantidad} pero solo hay ${formatQty(sobreStock.disponible)} disponible.`
      return false
    }
    saving.value = true
    try {
      await pedidos.create({
        clienteNombre: cliente.value,
        clienteCodigo: clienteCodigo.value,
        plazoCreditoDias: plazoCreditoDias.value,
        items: lineas.value.map((l) => ({
          productoCodigo: l.productoCodigo,
          productoNombre: l.productoNombre,
          unidad: l.unidad,
          bodega: l.bodega,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
        })),
        foto: foto.value || undefined,
        observacion: observacion.value || undefined,
      })
      return true
    } catch (err) {
      error.value = (err as ApiError)?.message || 'No se pudo enviar el pedido'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    cliente, observacion, plazoCreditoDias, lineas, buscar, foto, saving, error, cargandoInv,
    resultados, total, reset, agregar, quitar, guardar,
  }
}
