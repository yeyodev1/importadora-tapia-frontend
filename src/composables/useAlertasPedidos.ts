import { ref } from 'vue'
import { pedidosService } from '@/services/pedidos.service'
import { usePedidosStore } from '@/stores/pedidos'
import { useUserStore } from '@/stores/user'
import { audioListo, desbloquearAudio, sonarAlarma } from '@/utils/alarma'
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

/** Qué le importa a cada rol: admin aprueba, bodega despacha, vendedor espera respuesta. */
function eventoDe(p: Pedido, rol: string | null): AlertaPedido | null {
  const det = `${p.numero} · ${p.clienteNombre}`
  if (rol === 'admin' && p.estado === 'enviado') {
    return { clave: `${p._id}:enviado`, titulo: 'Nueva orden de pedido', detalle: `${det} · por aprobar`, destino: '/pedidos', tono: 'nuevo' }
  }
  if (rol === 'bodega' && p.estado === 'aprobado' && !p.despacho?.salidaAt) {
    return { clave: `${p._id}:aprobado`, titulo: 'Nueva orden para despachar', detalle: det, destino: '/bodega', tono: 'nuevo' }
  }
  if (rol === 'vendedor' && p.estado === 'aprobado') {
    return { clave: `${p._id}:aprobado`, titulo: 'Tu pedido fue aprobado', detalle: det, destino: '/pedidos', tono: 'ok' }
  }
  if (rol === 'vendedor' && p.estado === 'rechazado') {
    return { clave: `${p._id}:rechazado`, titulo: 'Tu pedido fue rechazado', detalle: det, destino: '/pedidos', tono: 'mal' }
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

function avisar(nuevas: AlertaPedido[]) {
  sonarAlarma()
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
    sonarAlarma()
  }

  function cerrar(clave: string) {
    alertas.value = alertas.value.filter((a) => a.clave !== clave)
    if (!alertas.value.length) pararTitulo()
  }

  return { alertas, sonidoListo, iniciar, detener, activar, cerrar }
}
