/**
 * Middleware: guest
 * Redirige al home si el usuario YA está autenticado.
 * Se aplica a las páginas de login y signup.
 */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (!authStore.initialized) return abortNavigation()

  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
