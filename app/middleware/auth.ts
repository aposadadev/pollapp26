/**
 * Middleware: auth
 * Redirige a /login si el usuario no está autenticado.
 */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    return navigateTo('/login')
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
