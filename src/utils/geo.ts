/**
 * Obtiene la ubicación GPS actual del dispositivo.
 * Rechaza con un mensaje claro si el usuario no da permiso o no hay señal.
 */
export function obtenerUbicacion(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este dispositivo no permite ubicación GPS.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Debes permitir el acceso a tu ubicación para registrar la visita.'
            : 'No se pudo obtener tu ubicación. Verifica el GPS y vuelve a intentar.'
        reject(new Error(msg))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })
}
