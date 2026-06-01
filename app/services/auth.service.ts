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
  signInWithPopup,
  GoogleAuthProvider,
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
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
  'auth/popup-closed-by-user': 'El inicio de sesión fue cancelado.',
  'auth/cancelled-popup-request': 'Inicio de sesión en progreso. Cierra la otra ventana o espera.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Habilita las ventanas emergentes e intenta de nuevo.',
  'auth/different-credential-exists': 'Este correo ya está registrado con otro método de inicio de sesión (ej. correo y contraseña). Por favor, ingresa usando tus credenciales originales.'
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
    displayName: string
  ): Promise<UserProfile> {
    try {
      const existingProfile = await userRepository.findByEmail(email)
      if (existingProfile) {
        throw new AuthError('Ya existe una cuenta registrada con este correo electrónico.', 'auth/email-already-in-use')
      }

      const credential = await createUserWithEmailAndPassword(getAuth(), email, password)
      const profileData: Omit<UserProfile, 'id' | 'createdAt'> = {
        displayName,
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

  async loginWithGoogle(): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider()
      const credential = await signInWithPopup(getAuth(), provider)
      const { uid, email, displayName, photoURL } = credential.user

      const profile = await userRepository.findById(uid)
      if (profile) {
        if (photoURL && profile.photoURL !== photoURL) {
          await userRepository.update(uid, { photoURL })
          profile.photoURL = photoURL
        }
        if (photoURL && useNuxtApp().$firestore) {
          try {
            const { boardRepository } = await import('~/repositories/board.repository')
            const boards = await boardRepository.findByUser(uid)
            for (const b of boards) {
              if (b.userPhotoURL !== photoURL) {
                await boardRepository.update(b.id, { userPhotoURL: photoURL })
              }
            }
          } catch (e) {
            console.error('Error syncing photoURL to boards:', e)
          }
        }
        return profile
      }

      if (email) {
        const existingProfile = await userRepository.findByEmail(email)
        if (existingProfile) {
          throw new AuthError(
            'Este correo ya está registrado con otro método de inicio de sesión (ej. correo y contraseña). Por favor, ingresa usando tus credenciales originales.',
            'auth/different-credential-exists'
          )
        }
      }

      const profileData: Omit<UserProfile, 'id' | 'createdAt'> = {
        displayName: displayName || email?.split('@')[0] || 'Usuario de Google',
        email: email || '',
        photoURL: photoURL || undefined,
        isAdmin: false
      }
      await userRepository.createProfile(uid, profileData)
      return { id: uid, ...profileData, createdAt: new Date() }
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
