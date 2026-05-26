/**
 * useNotifications — Composable para push notifications con Firebase FCM
 *
 * Diseñado para ser extensible: agregar un nuevo tipo de notificación solo
 * requiere agregar el campo en NotificationPrefs (types/user.ts) y el template
 * correspondiente en functions/src/notifications/templates.ts.
 *
 * Flujo:
 * 1. El usuario activa notificaciones en su perfil
 * 2. Se pide permiso al navegador
 * 3. Se registra el firebase-messaging-sw.js y se le pasa la config de Firebase
 * 4. Se obtiene el token FCM y se guarda en Firestore (users/{uid}.fcmTokens)
 * 5. Las Cloud Functions usan esos tokens para enviar pushes
 *
 * Para desactivar:
 * 1. Se obtiene el token actual
 * 2. Se elimina de Firestore
 * 3. El usuario deja de recibir notificaciones en este dispositivo
 */
import { getToken, type Messaging } from 'firebase/messaging'
import { userRepository } from '~/repositories/user.repository'
import type { NotificationPrefs } from '~/types'

const DEFAULT_PREFS: NotificationPrefs = {
  matchReminder: true,
  reminderHoursBeforeMatch: 2
}

export function useNotifications() {
  const { $firebaseMessaging } = useNuxtApp()
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  const toast = useToast()

  const messaging = $firebaseMessaging as Messaging | null

  // ── Estado reactivo ──────────────────────────────────────────────────────────

  /** Permiso actual del navegador: 'default' | 'granted' | 'denied' */
  const permission = ref<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  /** Si el navegador soporta notificaciones */
  const isSupported = computed(
    () => typeof Notification !== 'undefined' && 'serviceWorker' in navigator && messaging !== null
  )

  /** Si este dispositivo ya tiene notificaciones activas */
  const isSubscribed = ref(false)

  /** Token FCM del dispositivo actual */
  const currentToken = ref<string | null>(null)

  /** Preferencias del usuario */
  const prefs = ref<NotificationPrefs>({ ...DEFAULT_PREFS })

  /** Operación en curso (para UI de carga) */
  const loading = ref(false)

  /** Si el navegador es Brave */
  const isBrave = ref(false)
  if (typeof navigator !== 'undefined') {
    const nav = navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } }
    if (nav.brave && typeof nav.brave.isBrave === 'function') {
      nav.brave.isBrave().then((val: boolean) => {
        isBrave.value = val
      })
    }
  }

  /**
   * Inicializa y sincroniza el estado de las notificaciones para el usuario actual.
   * Si el permiso ya está otorgado pero el token no está en Firestore, lo registra silenciosamente.
   */
  async function initialize(): Promise<void> {
    if (!isSupported.value || !authStore.user?.id) {
      isSubscribed.value = false
      currentToken.value = null
      return
    }

    try {
      const registrationPromise = navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      const timeoutRegPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 2000))
      const registration = await Promise.race([registrationPromise, timeoutRegPromise]).catch(() => null)

      if (registration) {
        const tokenPromise = getToken(messaging!, {
          vapidKey: config.public.firebaseVapidKey,
          serviceWorkerRegistration: registration
        })
        const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 5000))
        const token = await Promise.race([tokenPromise, timeoutPromise]).catch(() => null)

        if (token) {
          currentToken.value = token
          const userTokens = authStore.user.fcmTokens ?? []
          isSubscribed.value = userTokens.includes(token)

          // Si el navegador tiene permiso pero el token no está registrado,
          // lo sincronizamos silenciosamente para evitar estados huérfanos.
          if (permission.value === 'granted' && !isSubscribed.value) {
            await userRepository.saveFcmToken(authStore.user.id, token)
            isSubscribed.value = true
            // Actualizar localmente el store
            const currentTokens = authStore.user.fcmTokens ?? []
            if (!currentTokens.includes(token)) {
              authStore.user.fcmTokens = [...currentTokens, token]
            }
          }
        } else {
          isSubscribed.value = false
        }
      } else {
        isSubscribed.value = false
      }
    } catch (err) {
      if (import.meta.dev) console.warn('[FCM] Error al inicializar suscripción:', err)
      isSubscribed.value = false
    }
  }

  // Sincronizar prefs y estado desde el perfil del usuario
  watch(
    () => authStore.user,
    async (user) => {
      if (!user) {
        isSubscribed.value = false
        currentToken.value = null
        prefs.value = { ...DEFAULT_PREFS }
        return
      }
      prefs.value = user.notificationPrefs ?? { ...DEFAULT_PREFS }
      await initialize()
    },
    { immediate: true }
  )

  onMounted(() => {
    initialize()
  })

  // ── Registro del SW y obtención de token ─────────────────────────────────────

  /**
   * Registra el firebase-messaging-sw.js y envía la Firebase config al SW
   * (necesario porque el SW no tiene acceso al runtimeConfig de Nuxt).
   * Retorna la registration para pasarla a getToken().
   */
  async function _registerFcmSW(): Promise<ServiceWorkerRegistration> {
    const swUrl = `/firebase-messaging-sw.js`

    try {
      const existingPromise = navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      const timeoutRegPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 2000))
      const existing = await Promise.race([existingPromise, timeoutRegPromise]).catch(() => null)

      if (existing) {
        const hasParams = existing.active?.scriptURL.includes('apiKey=')
        if (hasParams) {
          // Desregistrar el antiguo SW parametrizado con un timeout de 2 segundos para evitar bloqueos
          await Promise.race([
            existing.unregister(),
            new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2000))
          ]).catch(() => null)
        }
      }
    } catch (err) {
      if (import.meta.dev) console.warn('[FCM] Error checking existing SW registration:', err)
    }

    const registerPromise = navigator.serviceWorker.register(swUrl, { scope: '/' })
    const timeoutRegisterPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SW registration timed out')), 6000)
    )
    const registration = await Promise.race([registerPromise, timeoutRegisterPromise])

    // Esperar a que el SW esté activo con un timeout de 5 segundos
    if (registration.installing || registration.waiting) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing ?? registration.waiting
        function handler(e: Event) {
          if ((e.target as ServiceWorker).state === 'activated') {
            clearTimeout(timeoutId)
            sw?.removeEventListener('statechange', handler)
            resolve()
          }
        }

        const timeoutId = setTimeout(() => {
          sw?.removeEventListener('statechange', handler)
          resolve() // Resolver de todos modos para evitar colgar el flujo
        }, 5000)

        sw?.addEventListener('statechange', handler)
      })
    }

    return registration
  }

  /**
   * Solicita permiso de forma segura soportando callbacks (Safari legacy)
   * y promesas (navegadores modernos).
   */
  async function _requestPermissionSafe(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') return 'default'

    if (Notification.permission !== 'default') {
      return Notification.permission
    }

    return new Promise((resolve) => {
      try {
        const p = Notification.requestPermission()
        if (p && typeof p.then === 'function') {
          p.then(resolve).catch(() => resolve('default'))
          return
        }
      } catch (error) {
        // Ignorar y pasar a fallback de callback
        console.error('Error al solicitar permiso de notificaciones:', error)
      }

      try {
        Notification.requestPermission((result) => {
          resolve(result)
        })
      } catch {
        // Fallback final
        resolve('default')
      }
    })
  }

  /**
   * Solicita permiso al navegador y obtiene el token FCM.
   * Guarda el token en Firestore para que las Cloud Functions puedan enviar pushes.
   */
  async function enableNotifications(): Promise<boolean> {
    if (!isSupported.value) {
      toast.add({
        title: 'No soportado',
        description: 'Tu navegador no soporta notificaciones push.',
        color: 'neutral'
      })
      return false
    }

    if (!config.public.firebaseVapidKey) {
      if (import.meta.dev) console.warn('[FCM] VAPID key no configurada. Ver README para instrucciones.')
      toast.add({
        title: 'Configuración pendiente',
        description: 'Las notificaciones requieren configuración adicional.',
        color: 'neutral'
      })
      return false
    }

    loading.value = true
    try {
      // 1. Pedir permiso de forma segura
      const result = await _requestPermissionSafe()
      permission.value = result
      console.log('Permiso de notificaciones:', result)
      if (result !== 'granted') {
        toast.add({
          title: 'Permiso denegado',
          description: 'Activa las notificaciones en la configuración de tu navegador.',
          color: 'neutral'
        })
        return false
      }

      // 2. Registrar SW y obtener token
      const registration = await _registerFcmSW()
      const tokenPromise = getToken(messaging!, {
        vapidKey: config.public.firebaseVapidKey,
        serviceWorkerRegistration: registration
      })
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('FCM token request timed out')), 8000)
      )
      const token = await Promise.race([tokenPromise, timeoutPromise])

      currentToken.value = token

      // 3. Guardar token en Firestore
      if (authStore.user?.id) {
        await userRepository.saveFcmToken(authStore.user.id, token)
        // Guardar prefs si es la primera vez
        if (!authStore.user.notificationPrefs) {
          await userRepository.updateNotificationPrefs(authStore.user.id, prefs.value)
        }
      }

      isSubscribed.value = true
      toast.add({
        title: '¡Notificaciones activadas!',
        description: 'Te avisaremos antes de que empiecen los partidos.',
        color: 'secondary'
      })
      return true
    } catch (err: unknown) {
      if (import.meta.dev) console.error('[FCM] Error al activar notificaciones:', err)

      const errorMsg = err instanceof Error ? err.message : String(err)
      const isTimeout = errorMsg.includes('timed out') || errorMsg.includes('timeout')

      if (isBrave.value) {
        toast.add({
          title: 'Configuración en Brave requerida',
          description: 'Brave requiere activar manualmente "Usar servicios de Google para la mensajería push" en brave://settings/privacy, reiniciar el navegador y reintentar.',
          color: 'warning',
          duration: 12000
        })
      } else if (isTimeout) {
        toast.add({
          title: 'Tiempo de espera agotado',
          description: 'No se pudo conectar con los servidores de notificaciones. Verifica tu conexión o bloqueador de publicidad.',
          color: 'error'
        })
      } else {
        toast.add({
          title: 'Error al activar',
          description: 'No pudimos activar las notificaciones. Intenta de nuevo.',
          color: 'error'
        })
      }
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Desactiva notificaciones en este dispositivo:
   * elimina el token de Firestore para que no lleguen más pushes.
   */
  async function disableNotifications(): Promise<void> {
    loading.value = true
    try {
      if (currentToken.value && authStore.user?.id) {
        await userRepository.removeFcmToken(authStore.user.id, currentToken.value)
      }
      currentToken.value = null
      isSubscribed.value = false
      toast.add({ title: 'Notificaciones desactivadas', color: 'neutral' })
    } catch {
      toast.add({ title: 'Error al desactivar', description: 'Intenta de nuevo.', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Guarda las preferencias de notificación (qué tipos activar, cuántas horas antes, etc.)
   */
  async function savePrefs(newPrefs: NotificationPrefs): Promise<void> {
    if (!authStore.user?.id) return
    loading.value = true
    try {
      await userRepository.updateNotificationPrefs(authStore.user.id, newPrefs)
      prefs.value = newPrefs
      // Sync al store para que la UI refleje el cambio inmediatamente
      if (authStore.user) {
        authStore.user = { ...authStore.user, notificationPrefs: newPrefs }
      }
      toast.add({ title: 'Preferencias guardadas', color: 'secondary' })
    } catch {
      toast.add({ title: 'Error al guardar', description: 'Intenta de nuevo.', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpia el token FCM de este dispositivo del perfil del usuario en Firestore.
   * Diseñado para llamarse durante el logout.
   */
  async function cleanupTokenOnLogout(): Promise<void> {
    try {
      if (!isSupported.value || !authStore.user?.id) return
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      if (registration) {
        const token = await getToken(messaging!, {
          vapidKey: config.public.firebaseVapidKey,
          serviceWorkerRegistration: registration
        }).catch(() => null)
        if (token && authStore.user.id) {
          await userRepository.removeFcmToken(authStore.user.id, token)
        }
      }
    } catch (err) {
      if (import.meta.dev) console.error('[FCM] Error al remover token en logout:', err)
    }
  }

  return {
    isSupported: readonly(isSupported),
    isSubscribed: readonly(isSubscribed),
    isBrave: readonly(isBrave),
    permission: readonly(permission),
    prefs: readonly(prefs),
    loading: readonly(loading),
    enableNotifications,
    disableNotifications,
    savePrefs,
    cleanupTokenOnLogout
  }
}
