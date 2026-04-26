/**
 * useAuth — Composable de autenticación
 * Puente entre las vistas y el AuthStore/AuthService.
 * Las páginas solo usan este composable, nunca el store directamente.
 */
import { parseFirebaseError } from '~/utils/firebase-error'

export function useAuth() {
  const store = useAuthStore()
  const toast = useToast()
  const router = useRouter()

  async function login(email: string, password: string): Promise<boolean> {
    try {
      await store.login(email, password)
      const hasSeenRules = import.meta.client ? localStorage.getItem('hasSeenRules') : false
      if (!hasSeenRules) {
        await router.push('/instructions')
      } else {
        await router.push('/')
      }
      return true
    } catch (err: unknown) {
      toast.add({
        title: 'Error al iniciar sesión',
        description: parseFirebaseError(err, 'No pudimos iniciar sesión. Verifica tus datos.'),
        color: 'error'
      })
      return false
    }
  }

  async function register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<boolean> {
    try {
      await store.register(email, password, firstName, lastName)
      const hasSeenRules = import.meta.client ? localStorage.getItem('hasSeenRules') : false
      if (!hasSeenRules) {
        await router.push('/instructions')
      } else {
        await router.push('/')
      }
      return true
    } catch (err: unknown) {
      toast.add({
        title: 'Error al registrarse',
        description: parseFirebaseError(err, 'No pudimos crear tu cuenta. Intenta de nuevo.'),
        color: 'error'
      })
      return false
    }
  }

  async function logout(): Promise<void> {
    try {
      await store.logout()
    } catch (err: unknown) {
      toast.add({
        title: 'Error al cerrar sesión',
        description: parseFirebaseError(err),
        color: 'error'
      })
    } finally {
      await router.push('/login')
    }
  }

  async function sendPasswordReset(email: string): Promise<boolean> {
    try {
      await store.sendPasswordReset(email)
      toast.add({
        title: 'Correo enviado',
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
        color: 'secondary'
      })
      return true
    } catch (err: unknown) {
      toast.add({
        title: 'Error',
        description: parseFirebaseError(err, 'No pudimos enviar el correo. Verifica tu dirección.'),
        color: 'error'
      })
      return false
    }
  }

  return {
    user: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    isAdmin: computed(() => store.isAdmin),
    loading: computed(() => store.loading),
    login,
    register,
    logout,
    sendPasswordReset
  }
}
