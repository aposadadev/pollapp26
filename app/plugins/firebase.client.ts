/**
 * Plugin de Firebase — inicializa la app y provee los servicios via useNuxtApp().
 * También inicializa el auth store para que esté listo para el middleware.
 *
 * isAdmin se lee de Firebase Custom Claims (request.auth.token.admin), no de un
 * campo Firestore. Esto garantiza que solo el Admin SDK puede elevar privilegios.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth, type User } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getDatabase, type Database } from 'firebase/database'
import { getFunctions, type Functions } from 'firebase/functions'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    ...(config.public.firebaseDatabaseURL
      ? { databaseURL: config.public.firebaseDatabaseURL }
      : {})
  }

  const app: FirebaseApp = getApps().length
    ? getApps()[0]!
    : initializeApp(firebaseConfig)

  const db: Firestore = getFirestore(app)
  const auth: Auth = getAuth(app)
  const storage: FirebaseStorage = getStorage(app)
  const functions: Functions = getFunctions(app, 'us-central1')

  // RTDB is optional
  const rtdb: Database | null = config.public.firebaseDatabaseURL
    ? getDatabase(app)
    : null

  /**
   * Loads the Firestore profile and reads the `admin` Custom Claim from the
   * Firebase ID token. The claim is set server-side via Admin SDK / Cloud
   * Functions — it cannot be self-assigned by a client.
   */
  async function resolveUser(firebaseUser: User) {
    const { authService } = await import('~/services/auth.service')
    const [profile, tokenResult] = await Promise.all([
      authService.getProfile(firebaseUser.uid),
      firebaseUser.getIdTokenResult()
    ])
    if (profile) {
      // Override isAdmin from custom claim — not from the Firestore document field
      profile.isAdmin = tokenResult.claims['admin'] === true
    }
    return profile
  }

  // Inicializar el auth store.
  // Await the FIRST onAuthStateChanged resolution so that by the time this plugin
  // returns — and route middleware runs — authStore.initialized is already true.
  const authStore = useAuthStore()
  const { onAuthStateChanged } = await import('firebase/auth')

  await new Promise<void>((resolve) => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      unsub() // unsubscribe after first emission; re-subscribe below for ongoing updates

      if (firebaseUser) {
        try {
          authStore.user = await resolveUser(firebaseUser)
        } catch (err) {
          if (import.meta.dev) console.error('Error loading profile:', err)
          authStore.user = null
        }
      } else {
        authStore.user = null
      }
      authStore.initialized = true
      resolve()
    })
  })

  // Ongoing listener for session changes (login / logout after initial load)
  const unsubOngoing = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        authStore.user = await resolveUser(firebaseUser)
      } catch (err) {
        if (import.meta.dev) console.error('Error loading profile:', err)
        authStore.user = null
      }
    } else {
      authStore.user = null
    }
    authStore.initialized = true
  })

  // Clean up the auth listener when the window unloads
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => unsubOngoing(), { once: true })
  }

  return {
    provide: {
      firebaseApp: app,
      firestore: db,
      firebaseAuth: auth,
      firebaseStorage: storage,
      firebaseFunctions: functions,
      firebaseRtdb: rtdb
    }
  }
})
