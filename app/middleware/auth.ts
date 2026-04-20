/**
 * Middleware: auth
 * Redirige a /login si el usuario no está autenticado.
 */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    // Auth state not yet known — plugin awaits first resolution, so this is
    // belt-and-suspenders: abort to prevent flash of protected content.
    return abortNavigation()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
