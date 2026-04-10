import { defineStore } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { authService } from '~/services/auth.service'
import type { UserProfile } from '~/types'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    initialized: false
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user,
    isAdmin: (state): boolean => state.user?.isAdmin ?? false,
    displayName: (state): string => state.user?.displayName ?? ''
  },

  actions: {
    /** Inicializa el listener de Firebase Auth. Llamar una vez en app.vue */
    init(): Promise<void> {
      return new Promise((resolve) => {
        // Obtener auth desde el plugin ya inicializado (evita importar Firebase
        // a nivel de módulo antes de que el plugin haya corrido)
        const { $firebaseAuth } = useNuxtApp()
        onAuthStateChanged($firebaseAuth as ReturnType<typeof import('firebase/auth').getAuth>, async (firebaseUser) => {
          if (firebaseUser) {
            const profile = await authService.getProfile(firebaseUser.uid)
            this.user = profile
          } else {
            this.user = null
          }
          this.initialized = true
          resolve()
        })
      })
    },

    async login(email: string, password: string): Promise<void> {
      this.loading = true
      try {
        this.user = await authService.login(email, password)
      } finally {
        this.loading = false
      }
    },

    async register(
      email: string,
      password: string,
      firstName: string,
      lastName: string
    ): Promise<void> {
      this.loading = true
      try {
        this.user = await authService.register(email, password, firstName, lastName)
      } finally {
        this.loading = false
      }
    },

    async logout(): Promise<void> {
      const groupContextStore = useGroupContextStore()
      groupContextStore.clearContext()
      await authService.logout()
      this.user = null
    },

    async sendPasswordReset(email: string): Promise<void> {
      await authService.sendPasswordReset(email)
    }
  }
})
