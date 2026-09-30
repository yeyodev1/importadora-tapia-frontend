import { ref, watch } from 'vue'

/**
 * Sonido de las alertas de pedidos, elegido en "Mi perfil". Se guarda en el
 * dispositivo (cada celular o PC suena distinto). Por defecto: activo al 100 %.
 */
const CLAVE = 'alertas_sonido'

function leer(): { activo: boolean; volumen: number } {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE) || '{}')
    const volumen = Number(p.volumen)
    return {
      activo: p.activo !== false,
      volumen: Number.isFinite(volumen) ? Math.min(100, Math.max(0, Math.round(volumen))) : 100,
    }
  } catch {
    return { activo: true, volumen: 100 }
  }
}

const inicial = leer()
const sonidoActivo = ref(inicial.activo)
/** 0 a 100. */
const volumen = ref(inicial.volumen)

watch([sonidoActivo, volumen], () => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ activo: sonidoActivo.value, volumen: volumen.value }))
  } catch {
    /* sin almacenamiento: vale solo para esta sesión */
  }
})

export function usePreferenciasAlerta() {
  /** Volumen efectivo para la alarma (0 si está desactivada). */
  const volumenAlarma = () => (sonidoActivo.value ? volumen.value / 100 : 0)
  return { sonidoActivo, volumen, volumenAlarma }
}
