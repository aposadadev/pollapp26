import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type UserCredential
} from 'firebase/auth'
import { authService, AuthError } from '~/services/auth.service'
import { userRepository } from '~/repositories/user.repository'
import type { UserProfile } from '~/types'

// Mock firebase/auth
vi.mock('firebase/auth', () => {
  return {
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    signInWithPopup: vi.fn(),
    /* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
    GoogleAuthProvider: class {
      static PROVIDER_ID = 'google.com'
    }
  }
})

// Mock userRepository
vi.mock('~/repositories/user.repository', () => {
  return {
    userRepository: {
      findById: vi.fn(),
      createProfile: vi.fn()
    }
  }
})

// Stub useNuxtApp
const mockAuth = {} as unknown as import('firebase/auth').Auth
vi.stubGlobal('useNuxtApp', () => ({
  $firebaseAuth: mockAuth
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('creates Firebase user and saves only displayName in Firestore profile', async () => {
      const email = 'new@example.com'
      const password = 'Password123'
      const displayName = 'Juan Carlos Pérez'

      const mockFirebaseUser = { uid: 'user-123', email }
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockFirebaseUser
      } as UserCredential)

      vi.mocked(userRepository.createProfile).mockResolvedValue(undefined)

      const result = await authService.register(email, password, displayName)

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, email, password)
      expect(userRepository.createProfile).toHaveBeenCalledWith('user-123', {
        displayName,
        email,
        isAdmin: false
      })
      expect(result.displayName).toBe(displayName)
      expect(result.email).toBe(email)
      expect(result.id).toBe('user-123')
    })
  })

  describe('loginWithGoogle', () => {
    it('signs in with Google Popup and returns existing profile if found', async () => {
      const mockFirebaseUser = {
        uid: 'google-uid-123',
        email: 'google@example.com',
        displayName: 'Maria Garcia',
        photoURL: 'https://photo.url/maria'
      }

      vi.mocked(signInWithPopup).mockResolvedValue({
        user: mockFirebaseUser
      } as unknown as UserCredential)

      const existingProfile: UserProfile = {
        id: 'google-uid-123',
        displayName: 'Maria Garcia',
        email: 'google@example.com',
        isAdmin: false,
        photoURL: 'https://photo.url/maria',
        createdAt: new Date()
      }
      vi.mocked(userRepository.findById).mockResolvedValue(existingProfile)

      const result = await authService.loginWithGoogle()

      expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, expect.any(GoogleAuthProvider))
      expect(userRepository.findById).toHaveBeenCalledWith('google-uid-123')
      expect(userRepository.createProfile).not.toHaveBeenCalled()
      expect(result).toEqual(existingProfile)
    })

    it('signs in with Google Popup and creates new profile if not found', async () => {
      const mockFirebaseUser = {
        uid: 'google-uid-456',
        email: 'newgoogle@example.com',
        displayName: 'Carlos Sanchez',
        photoURL: 'https://photo.url/carlos'
      }

      vi.mocked(signInWithPopup).mockResolvedValue({
        user: mockFirebaseUser
      } as unknown as UserCredential)

      vi.mocked(userRepository.findById).mockResolvedValue(null)
      vi.mocked(userRepository.createProfile).mockResolvedValue(undefined)

      const result = await authService.loginWithGoogle()

      expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, expect.any(GoogleAuthProvider))
      expect(userRepository.findById).toHaveBeenCalledWith('google-uid-456')
      expect(userRepository.createProfile).toHaveBeenCalledWith('google-uid-456', {
        displayName: 'Carlos Sanchez',
        email: 'newgoogle@example.com',
        photoURL: 'https://photo.url/carlos',
        isAdmin: false
      })
      expect(result.id).toBe('google-uid-456')
      expect(result.displayName).toBe('Carlos Sanchez')
      expect(result.email).toBe('newgoogle@example.com')
      expect(result.photoURL).toBe('https://photo.url/carlos')
    })

    it('propagates mapped AuthError if signInWithPopup fails', async () => {
      const firebaseError = { code: 'auth/popup-closed-by-user' }
      vi.mocked(signInWithPopup).mockRejectedValue(firebaseError)

      await expect(authService.loginWithGoogle()).rejects.toThrow(AuthError)
    })
  })
})
