/**
 * AuthService — Lógica de autenticación con Firebase Auth
 * Orquesta Firebase Auth + UserRepository para mantener el perfil en Firestore.
 *
 * IMPORTANTE: auth se resuelve de forma lazy en cada método mediante useNuxtApp()
 * para garantizar que el plugin de Firebase ya esté inicializado.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type Auth,
  type User
} from 'firebase/auth'
import { userRepository } from '~/repositories/user.repository'
import type { UserProfile } from '~/types'

function getAuth(): Auth {
  return useNuxtApp().$firebaseAuth as Auth
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El formato del correo electrónico no es válido.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet.'
}

function mapAuthError(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? 'Ocurrió un error inesperado. Intenta de nuevo.'
}

export class AuthService {
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const credential = await signInWithEmailAndPassword(getAuth(), email, password)
      const profile = await userRepository.findById(credential.user.uid)
      if (!profile) throw new AuthError('Perfil de usuario no encontrado.', 'profile/not-found')
      return profile
    } catch (err: unknown) {
      if (err instanceof AuthError) throw err
      const code = (err as { code?: string }).code ?? 'unknown'
      throw new AuthError(mapAuthError(code), code)
    }
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<UserProfile> {
    try {
      const credential = await createUserWithEmailAndPassword(getAuth(), email, password)
      const displayName = `${firstName} ${lastName}`
      const profileData: Omit<UserProfile, 'id' | 'createdAt'> = {
        displayName,
        firstName,
        lastName,
        email,
        isAdmin: false
      }
      await userRepository.createProfile(credential.user.uid, profileData)
      return { id: credential.user.uid, ...profileData, createdAt: new Date() }
    } catch (err: unknown) {
      if (err instanceof AuthError) throw err
      const code = (err as { code?: string }).code ?? 'unknown'
      throw new AuthError(mapAuthError(code), code)
    }
  }

  async logout(): Promise<void> {
    await signOut(getAuth())
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getAuth(), email)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? 'unknown'
      throw new AuthError(mapAuthError(code), code)
    }
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    return userRepository.findById(uid)
  }

  getCurrentFirebaseUser(): User | null {
    return getAuth().currentUser
  }
}

export const authService = new AuthService()
