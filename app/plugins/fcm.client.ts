/**
 * Plugin FCM — Firebase Cloud Messaging (client-side only)
 *
 * Responsabilidades:
 * 1. Inicializa el módulo firebase/messaging
 * 2. Registra el handler para mensajes en FOREGROUND (app abierta)
 *    — muestra un toast con el contenido de la notificación
 * 3. Provee la instancia de messaging vía $firebaseMessaging
 *
 * El manejo de mensajes en BACKGROUND lo hace el service worker
 * en /public/firebase-messaging-sw.js
 */
import { getMessaging, onMessage, type Messaging } from 'firebase/messaging'
import type { FirebaseApp } from 'firebase/app'

export default defineNuxtPlugin<{ firebaseMessaging: Messaging | null }>((nuxtApp) => {
  // Solo ejecutar si el navegador soporta FCM
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { provide: { firebaseMessaging: null } }
  }

  const app = nuxtApp.$firebaseApp as FirebaseApp
  let messaging: Messaging | null = null

  try {
    messaging = getMessaging(app)
  } catch (err) {
    // En localhost sin HTTPS puede fallar — ignorar silenciosamente
    if (import.meta.dev) console.warn('[FCM] getMessaging falló:', err)
    return { provide: { firebaseMessaging: null } }
  }

  /**
   * Handler de mensajes en FOREGROUND.
   * Cuando la app está abierta y llega un push, Firebase no muestra
   * la notificación del sistema automáticamente — lo manejamos aquí como toast.
   */
  onMessage(messaging, (payload) => {
    const toast = useToast()
    const title = payload.notification?.title ?? 'Mundial 26'
    const description = payload.notification?.body ?? ''
    const url = payload.data?.url

    toast.add({
      title,
      description,
      color: 'primary',
      duration: 6000,
      ...(url
        ? {
            actions: [{
              label: 'Ver',
              onClick: () => { useRouter().push(url) }
            }]
          }
        : {})
    })
  })

  return {
    provide: {
      firebaseMessaging: messaging
    }
  }
})
