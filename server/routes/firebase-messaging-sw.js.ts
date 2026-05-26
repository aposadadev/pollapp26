import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  setHeader(event, 'Content-Type', 'application/javascript')
  setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')

  const swContent = `/**
 * Firebase Cloud Messaging — Service Worker (Dynamic via Nitro)
 */

importScripts('/js/firebase-app-compat.js')
importScripts('/js/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: ${JSON.stringify(config.public.firebaseApiKey)},
  authDomain: ${JSON.stringify(config.public.firebaseAuthDomain)},
  projectId: ${JSON.stringify(config.public.firebaseProjectId)},
  storageBucket: ${JSON.stringify(config.public.firebaseStorageBucket)},
  messagingSenderId: ${JSON.stringify(config.public.firebaseMessagingSenderId)},
  appId: ${JSON.stringify(config.public.firebaseAppId)}
}

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    firebase.initializeApp(firebaseConfig)
    const messaging = firebase.messaging()

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
        tag,
        renotify: false,
        data: { url },
        vibrate: [200, 100, 200]
      })
    })
  } catch (err) {
    console.error('[SW] Error al inicializar Firebase FCM:', err)
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
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

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
`

  return swContent
})
