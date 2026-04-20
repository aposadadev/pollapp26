import { defineStore } from 'pinia'
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
    // isAdmin is sourced from Firebase Custom Claims (token.admin), set by
    // the Admin SDK. The firebase.client.ts plugin writes the claim value
    // into user.isAdmin — it is NOT read from the plain Firestore document field.
    isAdmin: (state): boolean => state.user?.isAdmin ?? false,
    displayName: (state): string => state.user?.displayName ?? ''
  },

  actions: {
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
