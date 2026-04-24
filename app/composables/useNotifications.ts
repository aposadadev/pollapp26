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

  // Sincronizar prefs y estado desde el perfil del usuario
  watch(
    () => authStore.user,
    (user) => {
      if (!user) {
        isSubscribed.value = false
        currentToken.value = null
        prefs.value = { ...DEFAULT_PREFS }
        return
      }
      prefs.value = user.notificationPrefs ?? { ...DEFAULT_PREFS }
    },
    { immediate: true }
  )

  // ── Registro del SW y obtención de token ─────────────────────────────────────

  /**
   * Registra el firebase-messaging-sw.js y envía la Firebase config al SW
   * (necesario porque el SW no tiene acceso al runtimeConfig de Nuxt).
   * Retorna la registration para pasarla a getToken().
   */
  async function _registerFcmSW(): Promise<ServiceWorkerRegistration> {
    const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    const registration = existing ?? await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    })

    // Esperar a que el SW esté activo
    if (registration.installing || registration.waiting) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing ?? registration.waiting
        sw?.addEventListener('statechange', function handler(e) {
          if ((e.target as ServiceWorker).state === 'activated') {
            sw.removeEventListener('statechange', handler)
            resolve()
          }
        })
      })
    }

    // Enviar Firebase config al SW para que pueda inicializar el SDK compat
    const firebaseConfig = {
      apiKey: config.public.firebaseApiKey,
      authDomain: config.public.firebaseAuthDomain,
      projectId: config.public.firebaseProjectId,
      storageBucket: config.public.firebaseStorageBucket,
      messagingSenderId: config.public.firebaseMessagingSenderId,
      appId: config.public.firebaseAppId
    }

    const sw = registration.active
    if (sw) {
      sw.postMessage({ type: 'FCM_FIREBASE_CONFIG', config: firebaseConfig })
    }

    return registration
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
      // 1. Pedir permiso
      const result = await Notification.requestPermission()
      permission.value = result

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
      const token = await getToken(messaging!, {
        vapidKey: config.public.firebaseVapidKey,
        serviceWorkerRegistration: registration
      })

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
      toast.add({
        title: 'Error al activar',
        description: 'No pudimos activar las notificaciones. Intenta de nuevo.',
        color: 'error'
      })
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

  return {
    isSupported: readonly(isSupported),
    isSubscribed: readonly(isSubscribed),
    permission: readonly(permission),
    prefs: readonly(prefs),
    loading: readonly(loading),
    enableNotifications,
    disableNotifications,
    savePrefs
  }
}
