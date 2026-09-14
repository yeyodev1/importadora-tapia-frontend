import { solicitudesService } from '@/services/solicitudes.service'
import { fileToCompressedDataUri } from './image'
import type { DocumentoSolicitud, TipoDocumento } from '@/types/solicitudes'

const MAX_PDF_MB = 10

/**
 * Sube un documento de la solicitud directo a Cloudinary con la firma del
 * backend. Fotos: se comprimen (la cámara del celular pesa mucho).
 * PDF: se suben como "raw" para que siempre se puedan abrir y descargar.
 */
export async function subirDocumento(file: File, tipo: TipoDocumento): Promise<DocumentoSolicitud> {
  const esPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  const esImagen = file.type.startsWith('image/')
  if (!esPdf && !esImagen) throw new Error('Solo se aceptan fotos o archivos PDF.')
  if (esPdf && file.size > MAX_PDF_MB * 1024 * 1024) {
    throw new Error(`El PDF pesa más de ${MAX_PDF_MB} MB. Escanéalo con menor calidad o súbelo como foto.`)
  }

  let firma
  try {
    firma = await solicitudesService.firmaSubida()
  } catch (err) {
    throw new Error((err as { message?: string })?.message || 'No se pudo preparar la subida.')
  }

  const form = new FormData()
  form.append('file', esPdf ? file : await fileToCompressedDataUri(file, 1800, 0.8))
  form.append('api_key', firma.apiKey)
  form.append('timestamp', String(firma.timestamp))
  form.append('folder', firma.folder)
  form.append('signature', firma.signature)

  const recurso = esPdf ? 'raw' : 'image'
  let res: Response
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/${recurso}/upload`, {
      method: 'POST',
      body: form,
    })
  } catch {
    throw new Error('Sin conexión al subir el archivo. Revisa tu internet y vuelve a intentar.')
  }
  const data = (await res.json().catch(() => ({}))) as { secure_url?: string; bytes?: number; error?: { message?: string } }
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ? `No se pudo subir: ${data.error.message}` : 'No se pudo subir el archivo.')
  }

  return {
    tipo,
    url: data.secure_url,
    nombre: file.name.slice(0, 160),
    formato: esPdf ? 'pdf' : 'imagen',
    bytes: data.bytes || file.size,
  }
}
