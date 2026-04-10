/**
 * Plugin de Firebase — inicializa la app y provee los servicios via useNuxtApp().
 * También inicializa el auth store para que esté listo para el middleware.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getDatabase, type Database } from 'firebase/database'

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

  // RTDB is optional
  const rtdb: Database | null = config.public.firebaseDatabaseURL
    ? getDatabase(app)
    : null

  // Inicializar el auth store
  const authStore = useAuthStore()
  if (import.meta.client) {
    const { onAuthStateChanged } = await import('firebase/auth')
    onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid)
      if (firebaseUser) {
        try {
          const { authService } = await import('~/services/auth.service')
          const profile = await authService.getProfile(firebaseUser.uid)
          console.log('Profile loaded:', profile)
          authStore.user = profile
        } catch (err) {
          console.error('Error loading profile:', err)
          authStore.user = null
        }
      } else {
        authStore.user = null
      }
      authStore.initialized = true
      console.log('Auth initialized:', authStore.isAuthenticated)
    })
  }

  return {
    provide: {
      firebaseApp: app,
      firestore: db,
      firebaseAuth: auth,
      firebaseStorage: storage,
      firebaseRtdb: rtdb
    }
  }
})
