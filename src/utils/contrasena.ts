/**
 * Misma regla que el backend (auth.controller.ts): mínimo 8 caracteres, con al
 * menos una letra y un número. Devuelve el error o null si es válida.
 */
export function validarContrasena(pw: string): string | null {
  if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (pw.length > 72) return 'La contraseña no puede tener más de 72 caracteres'
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(pw) || !/\d/.test(pw)) {
    return 'La contraseña debe tener al menos una letra y un número'
  }
  return null
}

/** Normaliza el correo igual que el backend. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}
