import APIBase from './httpBase'
import type { LoginResponse } from '@/types/erp'

interface MensajeResponse {
  success: boolean
  message: string
}

export interface CambioCorreoResponse extends MensajeResponse {
  /** Token nuevo: el anterior lleva el correo viejo. */
  token: string
  user: LoginResponse['user']
}

/** Recuperar contraseña (rutas públicas) y cambio de correo (con sesión). */
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

  /** El usuario cambia su propio correo de acceso; exige su contraseña actual. */
  async cambiarCorreo(nuevoEmail: string, password: string): Promise<CambioCorreoResponse> {
    const res = await this.patch<CambioCorreoResponse>('auth/correo', { nuevoEmail, password })
    return res.data
  }
}

export const authService = new AuthService()
