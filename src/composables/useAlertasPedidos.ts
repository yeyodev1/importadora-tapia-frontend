import { ref } from 'vue'
import { pedidosService } from '@/services/pedidos.service'
import { usePedidosStore } from '@/stores/pedidos'
import { useUserStore } from '@/stores/user'
import { audioListo, desbloquearAudio, sonarAlarma } from '@/utils/alarma'
import { usePreferenciasAlerta } from '@/composables/usePreferenciasAlerta'
import type { Pedido } from '@/types/erp'

export interface AlertaPedido {
  clave: string
  titulo: string
  detalle: string
  destino: string
  tono: 'nuevo' | 'ok' | 'mal'
}

const INTERVALO = 15000
const CLAVE_VISTAS = 'alertas_pedidos_vistas'

// Estado compartido por toda la app (una sola consulta aunque se use en varios lugares).
const alertas = ref<AlertaPedido[]>([])
const sonidoListo = ref(false)
let timer: number | undefined
let desde: string | null = null
let revisando = false
let tituloTimer: number | undefined
let tituloOriginal = ''

function leerVistas(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_VISTAS) || '[]'))
  } catch {
    return new Set()
  }
}
const vistas = leerVistas()
function guardarVistas() {
  try {
    localStorage.setItem(CLAVE_VISTAS, JSON.stringify([...vistas].slice(-300)))
  } catch {
    /* sin almacenamiento */
  }
}

/** "2026-10-02" → "jue 2 oct" (sin correr la fecha por zona horaria). */
export function fechaCorta(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Qué le importa a cada rol: admin aprueba, bodega despacha, vendedor espera respuesta. */
function eventoDe(p: Pedido, rol: string | null): AlertaPedido | null {
  const det = `${p.numero} · ${p.clienteNombre}`
  if (rol === 'admin' && p.estado === 'enviado') {
    return { clave: `${p._id}:enviado`, titulo: 'Nueva orden de pedido', detalle: `${det} · por aprobar`, destino: '/pedidos', tono: 'nuevo' }
  }
  // Anulado: le interesa a la otra parte (asesor ↔ administración) y a bodega si ya lo tenía por despachar.
  if (p.estado === 'anulado' && p.anulacion) {
    const fueAprobado = p.historialEstado?.some((h) => h.estado === 'aprobado')
    const leInteresa =
      (rol === 'vendedor' && p.anulacion.rol !== 'vendedor') ||
      (rol === 'admin' && p.anulacion.rol !== 'admin') ||
      (rol === 'bodega' && fueAprobado)
    if (!leInteresa) return null
    return {
      clave: `${p._id}:anulado`,
      titulo: rol === 'bodega' ? 'Orden anulada: no despachar' : 'Pedido anulado',
      detalle: `${det} · ${p.anulacion.motivo}`,
      destino: rol === 'bodega' ? '/bodega' : '/pedidos',
      tono: 'mal',
    }
  }
  // Administración bajó cantidades: el asesor debe avisarle al cliente.
  const ajuste = p.ajustes?.length ? p.ajustes[p.ajustes.length - 1] : null
  if (rol === 'vendedor' && ajuste && !p.despacho?.salidaAt && Date.now() - new Date(ajuste.at).getTime() < 86400000) {
    const cambios = ajuste.cambios.map((c) => `${c.productoNombre} ${c.antes}→${c.despues}`).join(', ')
    return {
      clave: `${p._id}:ajuste:${p.ajustes!.length}`,
      titulo: 'Tu pedido cambió de cantidades',
      detalle: `${det} · ${cambios}${ajuste.nota ? ` · ${ajuste.nota}` : ''}`,
      destino: '/pedidos',
      tono: 'mal',
    }
  }
  if (rol === 'bodega' && p.estado === 'aprobado' && !p.despacho?.salidaAt) {
    return { clave: `${p._id}:aprobado`, titulo: 'Nueva orden para despachar', detalle: det, destino: '/bodega', tono: 'nuevo' }
  }
  // Retraso del despacho: le interesa al vendedor y a administración.
  const retraso = !p.despacho?.salidaAt && p.retrasos?.length ? p.retrasos[p.retrasos.length - 1] : null
  if (retraso && (rol === 'vendedor' || rol === 'admin')) {
    return {
      clave: `${p._id}:retraso:${p.retrasos!.length}`,
      titulo: 'Despacho retrasado',
      detalle: `${det} · sale el ${fechaCorta(retraso.nuevaFecha)}: ${retraso.motivo}`,
      destino: '/pedidos',
      tono: 'mal',
    }
  }
  if (rol === 'vendedor' && p.estado === 'en_espera') {
    // La clave cambia con cada decisión: si administración edita el mensaje, vuelve a sonar.
    return {
      clave: `${p._id}:en_espera:${p.historialEstado?.length ?? 0}`,
      titulo: 'Pedido en espera',
      detalle: p.motivoEspera ? `${det} · ${p.motivoEspera}` : det,
      destino: '/pedidos',
      tono: 'mal',
    }
  }
  if (rol === 'vendedor' && p.estado === 'aprobado') {
    const det2 = p.comentarioAprobacion ? `${det} · ${p.comentarioAprobacion}` : det
    return { clave: `${p._id}:aprobado`, titulo: 'Tu pedido fue aprobado', detalle: det2, destino: '/pedidos', tono: 'ok' }
  }
  if (rol === 'vendedor' && p.estado === 'rechazado') {
    const det2 = p.motivoRechazo ? `${det} · ${p.motivoRechazo}` : det
    return { clave: `${p._id}:rechazado`, titulo: 'Tu pedido no fue aprobado', detalle: det2, destino: '/pedidos', tono: 'mal' }
  }
  return null
}

function parpadearTitulo(texto: string) {
  if (tituloTimer) return
  tituloOriginal = document.title
  let encendido = false
  tituloTimer = window.setInterval(() => {
    encendido = !encendido
    document.title = encendido ? `(!) ${texto}` : tituloOriginal
  }, 1000)
}

function pararTitulo() {
  if (!tituloTimer) return
  window.clearInterval(tituloTimer)
  tituloTimer = undefined
  document.title = tituloOriginal
}

const preferencias = usePreferenciasAlerta()

function avisar(nuevas: AlertaPedido[]) {
  sonarAlarma(preferencias.volumenAlarma())
  sonidoListo.value = audioListo()
  const n = nuevas[0]!
  const cuerpo = nuevas.length > 1 ? `${n.detalle} y ${nuevas.length - 1} más` : n.detalle
  if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    try {
      new Notification(n.titulo, { body: cuerpo, tag: n.clave, requireInteraction: true })
    } catch {
      /* algunos celulares solo permiten notificaciones desde un service worker */
    }
  }
  parpadearTitulo(n.titulo)
}

async function revisar() {
  const userStore = useUserStore()
  if (revisando || !userStore.role || !localStorage.getItem('access_token')) return
  revisando = true
  try {
    const primera = desde === null
    const { data, ahora } = await pedidosService.novedades(desde || undefined)
    desde = ahora
    const nuevas: AlertaPedido[] = []
    for (const p of data) {
      const ev = eventoDe(p, userStore.role)
      if (!ev || vistas.has(ev.clave)) continue
      vistas.add(ev.clave)
      // Al abrir la app solo avisa lo de los últimos 5 minutos, no todo el historial.
      const reciente = !p.updatedAt || Date.now() - new Date(p.updatedAt).getTime() < 5 * 60000
      if (!primera || reciente) nuevas.push(ev)
    }
    guardarVistas()
    if (nuevas.length) {
      alertas.value = [...nuevas.reverse(), ...alertas.value].slice(0, 5)
      avisar(nuevas)
      const pedidos = usePedidosStore()
      if (pedidos.fetchedAt) pedidos.fetch(true)
    }
  } catch {
    /* sin conexión: se reintenta en el próximo ciclo */
  } finally {
    revisando = false
  }
}

function alVolver() {
  if (document.visibilityState === 'visible') revisar()
}

async function desbloquear() {
  sonidoListo.value = await desbloquearAudio()
  if (sonidoListo.value) window.removeEventListener('pointerdown', desbloquear)
}

export function useAlertasPedidos() {
  function iniciar() {
    if (timer) return
    revisar()
    timer = window.setInterval(revisar, INTERVALO)
    document.addEventListener('visibilitychange', alVolver)
    // Cualquier toque en la app habilita el sonido (regla de los navegadores).
    window.addEventListener('pointerdown', desbloquear, { passive: true })
  }

  function detener() {
    window.clearInterval(timer)
    timer = undefined
    desde = null
    document.removeEventListener('visibilitychange', alVolver)
    window.removeEventListener('pointerdown', desbloquear)
    pararTitulo()
  }

  /** Botón "Activar alertas con sonido": habilita audio, pide notificaciones y suena una prueba. */
  async function activar() {
    sonidoListo.value = await desbloquearAudio()
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        /* el usuario puede negarlo */
      }
    }
    sonarAlarma(preferencias.volumenAlarma())
  }

  function cerrar(clave: string) {
    alertas.value = alertas.value.filter((a) => a.clave !== clave)
    if (!alertas.value.length) pararTitulo()
  }

  return { alertas, sonidoListo, sonidoActivo: preferencias.sonidoActivo, iniciar, detener, activar, cerrar }
}
