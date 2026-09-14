import { ref, reactive, computed, watch } from 'vue'
import { solicitudesService } from '@/services/solicitudes.service'
import { useSolicitudesStore } from '@/stores/solicitudes'
import { useUserStore } from '@/stores/user'
import { faltantes, vacia } from './documentos'
import type { SolicitudCredito, SolicitudDatos } from '@/types/solicitudes'
import type { ApiError } from '@/types'

/** Completa una lista de referencias hasta `n` filas (la hoja tiene 2 de cada una). */
function rellenar<T>(lista: T[] | undefined, n: number, crear: () => T): T[] {
  const out = [...(lista || [])]
  while (out.length < n) out.push(crear())
  return out
}

/** Estado y reglas del formulario de solicitud de crédito (la vista solo pinta). */
export function useSolicitudForm() {
  const store = useSolicitudesStore()
  const userStore = useUserStore()

  const datos = reactive<SolicitudDatos>(vacia())
  const actual = ref<SolicitudCredito | null>(null)
  const cargando = ref(false)
  const guardando = ref(false)
  const subiendo = ref(false)
  const error = ref('')
  const aviso = ref('')

  function asignar(s: SolicitudDatos) {
    const base = vacia(s.tipo)
    Object.assign(datos, {
      ...base,
      ...s,
      titular: { ...base.titular, ...s.titular },
      negocio: { ...base.negocio, ...s.negocio },
      refComerciales: rellenar(s.refComerciales, 2, () => ({ proveedor: '', montoMes: '', plazoPago: '', telefono: '' })),
      refBancarias: rellenar(s.refBancarias, 2, () => ({ banco: '', cuenta: '' })),
      refPersonales: rellenar(s.refPersonales, 2, () => ({ nombres: '', apellidos: '', parentesco: '', telefonos: '' })),
      documentos: [...(s.documentos || [])],
      observacion: s.observacion || '',
    })
  }

  async function cargar(id: string) {
    cargando.value = true
    error.value = ''
    aviso.value = ''
    try {
      const s = await solicitudesService.getOne(id)
      actual.value = s
      asignar(s)
    } catch (err) {
      actual.value = null
      error.value = (err as ApiError)?.message || 'No se pudo cargar la solicitud'
    } finally {
      cargando.value = false
    }
  }

  function nueva(inicial: Partial<SolicitudDatos>) {
    actual.value = null
    error.value = ''
    aviso.value = ''
    asignar({ ...vacia(inicial.tipo), ...inicial })
  }

  /** Vendedor: edita borradores y rechazadas. Admin: todo menos aprobadas. */
  const editable = computed(() => {
    const e = actual.value?.estado
    if (!e) return true
    if (e === 'aprobada') return false
    return userStore.isAdmin || e === 'borrador' || e === 'rechazada'
  })

  /** Se puede mandar a revisión si aún no está enviada ni aprobada. */
  const puedeEnviar = computed(() => {
    const e = actual.value?.estado
    return editable.value && (!e || e === 'borrador' || e === 'rechazada')
  })

  const pendientes = computed(() => faltantes(datos))

  // Si el error era "falta X" y ya se completó todo, se quita el aviso viejo.
  watch(
    () => pendientes.value.length,
    (n) => {
      if (n === 0 && error.value.startsWith('Para enviar falta')) error.value = ''
    },
  )

  /** Guarda (borrador o cambios) o envía a revisión. Devuelve la solicitud guardada. */
  async function guardar(enviar: boolean): Promise<SolicitudCredito | null> {
    if (guardando.value || subiendo.value) return null
    error.value = ''
    aviso.value = ''
    if (enviar && pendientes.value.length) {
      error.value = `Para enviar falta: ${pendientes.value.join(', ')}.`
      return null
    }
    guardando.value = true
    try {
      const s = actual.value
        ? await solicitudesService.update(actual.value._id, datos, enviar)
        : await solicitudesService.create(datos, enviar)
      actualizar(s)
      aviso.value = enviar ? 'Solicitud enviada a administración para revisión.' : 'Cambios guardados.'
      return s
    } catch (err) {
      error.value = (err as ApiError)?.message || 'No se pudo guardar la solicitud'
      return null
    } finally {
      guardando.value = false
    }
  }

  function actualizar(s: SolicitudCredito) {
    actual.value = s
    asignar(s)
    store.upsert(s)
  }

  return {
    datos, actual, cargando, guardando, subiendo, error, aviso,
    editable, puedeEnviar, pendientes, cargar, nueva, guardar, actualizar,
  }
}
