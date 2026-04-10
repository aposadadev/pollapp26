/**
 * useAuth — Composable de autenticación
 * Puente entre las vistas y el AuthStore/AuthService.
 * Las páginas solo usan este composable, nunca el store directamente.
 */
export function useAuth() {
  const store = useAuthStore()
  const toast = useToast()
  const router = useRouter()

  async function login(email: string, password: string): Promise<boolean> {
    try {
      await store.login(email, password)
      await router.push('/')
      return true
    } catch (err: unknown) {
      toast.add({
        title: 'Error al iniciar sesión',
        description: (err as Error).message,
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
      await router.push('/')
      return true
    } catch (err: unknown) {
      toast.add({
        title: 'Error al registrarse',
        description: (err as Error).message,
        color: 'error'
      })
      return false
    }
  }

  async function logout(): Promise<void> {
    await store.logout()
    await router.push('/login')
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
        description: (err as Error).message,
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
