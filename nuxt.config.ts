// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],

  // SSR enabled — required for Nuxt server API routes (/api/*)
  // The frontend remains an SPA via routeRules below
  ssr: true,

  devtools: {
    enabled: true
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'es' },
      meta: [
        { name: 'theme-color', content: '#2D47A8' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Mundial 26' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/pwa/icon-192.png' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  // Firebase env vars exposed to the client via useRuntimeConfig().public
  runtimeConfig: {
    // Server-side only (NOT exposed to browser)
    firebaseAdminProjectId: process.env.FIREBASE_ADMIN_PROJECT_ID ?? '',
    firebaseAdminClientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? '',
    firebaseAdminPrivateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '',
    firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL ?? '',
    cronSecret: process.env.CRON_SECRET ?? '',

    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? '',
      firebaseDatabaseURL: process.env.NUXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
      /**
       * VAPID Key para Web Push / FCM.
       * Obtenerla en: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
       * Agregar al .env: NUXT_PUBLIC_FIREBASE_VAPID_KEY=BXXXX...
       */
      firebaseVapidKey: process.env.NUXT_PUBLIC_FIREBASE_VAPID_KEY ?? ''
    }
  },

  // All pages render as SPA (Firebase client SDK is browser-only).
  // Server API routes (/api/**) work normally as SSR endpoints.
  routeRules: {
    '/**': { ssr: false }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // ── PWA ───────────────────────────────────────────────────────────────────
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Quiniela Mundial 2026',
      short_name: 'Mundial 26',
      description: 'Quiniela del Copa Mundial de Fútbol 2026',
      theme_color: '#2D47A8',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/pwa/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/pwa/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'firebase-storage',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600 // 1 hour
    },
    devOptions: {
      enabled: false // disable in dev to avoid noise
    }
  }
})
