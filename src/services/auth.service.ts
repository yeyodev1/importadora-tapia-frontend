import APIBase from './httpBase'

interface MensajeResponse {
  success: boolean
  message: string
}

/** Recuperar contraseña: rutas públicas (no requieren sesión). */
class AuthService extends APIBase {
  /** Pide el enlace al correo. El backend responde igual exista o no la cuenta. */
  async olvideContrasena(email: string): Promise<MensajeResponse> {
    const res = await this.post<MensajeResponse>('auth/olvide-contrasena', { email })
    return res.data
  }

  /** Guarda la nueva contraseña usando el token del enlace (uso único). */
  async restablecerContrasena(token: string, password: string): Promise<MensajeResponse> {
    const res = await this.post<MensajeResponse>('auth/restablecer-contrasena', { token, password })
    return res.data
  }
}

export const authService = new AuthService()
