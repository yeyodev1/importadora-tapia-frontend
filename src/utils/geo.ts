function leer(opciones: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, opciones))
}

/**
 * Obtiene la ubicación actual del dispositivo.
 * 1) GPS preciso. 2) Si no hay señal (dentro de un local), la ubicación
 * aproximada de la red, para que la visita igual se pueda registrar.
 * Rechaza con un mensaje claro si el usuario no da permiso.
 */
export async function obtenerUbicacion(): Promise<{ lat: number; lng: number }> {
  if (!navigator.geolocation) throw new Error('Este dispositivo no permite ubicación GPS.')
  try {
    const p = await leer({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 })
    return { lat: p.coords.latitude, lng: p.coords.longitude }
  } catch (err) {
    if ((err as GeolocationPositionError)?.code === 1) {
      throw new Error('Debes permitir el acceso a tu ubicación para registrar la visita. Actívalo en los ajustes del navegador y vuelve a intentar.')
    }
  }
  try {
    const p = await leer({ enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 })
    return { lat: p.coords.latitude, lng: p.coords.longitude }
  } catch {
    throw new Error('No se pudo obtener tu ubicación. Activa el GPS, acércate a una ventana o sal un momento y vuelve a intentar.')
  }
}
