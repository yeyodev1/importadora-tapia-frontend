import { ref } from 'vue'

/**
 * Pausa una subida para que el usuario recorte la foto antes de enviarla.
 * `prepararArchivo` devuelve la foto recortada (o la original si elige usarla
 * completa), null si cancela. Los PDF pasan directo, sin recorte.
 */
export function useRecorte() {
  const archivo = ref<File | null>(null)
  let resolver: ((f: File | null) => void) | null = null

  function prepararArchivo(file: File): Promise<File | null> {
    if (!file.type.startsWith('image/')) return Promise.resolve(file)
    archivo.value = file
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  function terminar(f: File | null) {
    archivo.value = null
    resolver?.(f)
    resolver = null
  }

  return {
    archivo,
    prepararArchivo,
    listo: (f: File) => terminar(f),
    cancelar: () => terminar(null),
  }
}
