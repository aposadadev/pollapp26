/**
 * Middleware: admin
 * Redirige al home si el usuario no es administrador.
 * Se aplica a todas las rutas bajo /admin.
 */
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    return abortNavigation()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  if (!authStore.isAdmin) {
    return navigateTo('/')
  }
})
