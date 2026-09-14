/**
 * Alarma de "nueva orden" generada con Web Audio (no depende de archivos).
 * Los navegadores bloquean el sonido hasta que la persona toca la pantalla una
 * vez: por eso existe `desbloquearAudio`, que se llama en ese primer toque.
 */
let ctx: AudioContext | null = null

function contexto(): AudioContext | null {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

export function audioListo(): boolean {
  return !!ctx && ctx.state === 'running'
}

/** Llamar dentro de un toque o clic. Devuelve true si el sonido quedó habilitado. */
export async function desbloquearAudio(): Promise<boolean> {
  const c = contexto()
  if (!c) return false
  if (c.state === 'suspended') {
    try {
      await c.resume()
    } catch {
      return false
    }
  }
  // Pulso inaudible: algunos navegadores solo habilitan el audio tras reproducir algo.
  const o = c.createOscillator()
  const g = c.createGain()
  g.gain.value = 0.0001
  o.connect(g).connect(c.destination)
  o.start()
  o.stop(c.currentTime + 0.02)
  return c.state === 'running'
}

/** Alarma fuerte y llamativa: 3 ráfagas de dos tonos (~2.4 s) + vibración. */
export function sonarAlarma(): boolean {
  try {
    navigator.vibrate?.([300, 120, 300, 120, 600])
  } catch {
    /* sin vibración */
  }
  const c = contexto()
  if (!c || c.state !== 'running') return false

  // Compresor: sube el volumen percibido sin distorsionar.
  const comp = c.createDynamicsCompressor()
  comp.threshold.value = -12
  comp.ratio.value = 6
  comp.connect(c.destination)

  const t0 = c.currentTime + 0.05
  for (let rafaga = 0; rafaga < 3; rafaga++) {
    for (let k = 0; k < 4; k++) {
      const t = t0 + rafaga * 0.8 + k * 0.14
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'square'
      o.frequency.setValueAtTime(k % 2 ? 1320 : 988, t)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
      o.connect(g).connect(comp)
      o.start(t)
      o.stop(t + 0.13)
    }
  }
  return true
}
