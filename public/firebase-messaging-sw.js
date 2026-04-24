/**
 * Firebase Cloud Messaging — Service Worker
 *
 * Este SW es independiente del SW de la PWA (generado por Vite PWA).
 * Se registra exclusivamente para recibir push notifications en background.
 *
 * El cliente lo registra vía useNotifications y le pasa la Firebase config
 * mediante postMessage antes de llamar a getToken().
 *
 * Para agregar comportamientos nuevos al recibir una notificación (vibrar,
 * abrir una URL específica, etc.) edita el handler de onBackgroundMessage.
 */

// ── SDK compat (se importa en el top level del SW, requerimiento del navegador) ──
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

// ── Inicialización lazy cuando el cliente manda la config ─────────────────────
let messaging = null

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'FCM_FIREBASE_CONFIG') return
  if (firebase.apps.length > 0) return // ya inicializado (hot reload / múltiples tabs)

  firebase.initializeApp(event.data.config)
  messaging = firebase.messaging()

  /**
   * onBackgroundMessage — Maneja notificaciones cuando la app está en background.
   *
   * Firebase envía el payload desde el servidor (Cloud Function).
   * Si el payload incluye `notification.title`, Chrome lo muestra automáticamente
   * SIN necesidad de llamar showNotification(). Aquí lo hacemos manual para
   * controlar los datos extras (tag, badge, vibration, data para notificationclick).
   */
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Mundial 26'
    const body = payload.notification?.body ?? ''
    const icon = payload.notification?.icon ?? '/pwa/icon-192.png'
    const tag = payload.data?.tag ?? 'mundial26-default'
    const url = payload.data?.url ?? '/'

    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/pwa/icon-192.png',
      tag,                   // Evita duplicar notificaciones del mismo tipo
      renotify: false,       // No re-vibra si ya hay una con el mismo tag
      data: { url },         // Lo lee notificationclick para navegar
      // Vibración personalizable por tipo de notificación
      vibrate: [200, 100, 200]
    })
  })
})

// ── Clic en notificación ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    // Intenta enfocar una tab ya abierta de la app antes de abrir una nueva
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const appOrigin = self.location.origin
        for (const client of clientList) {
          if (client.url.startsWith(appOrigin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})
