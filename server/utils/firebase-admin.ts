/**
 * Firebase Admin SDK — Server-side initialization
 *
 * Initializes the Admin SDK using environment variables (no JSON key file needed).
 * Used exclusively by Nuxt server API routes (server/api/**).
 *
 * Credentials come from a Firebase Service Account:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 *
 * Required env vars (server-side only, NOT prefixed with NUXT_PUBLIC_):
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY
 *   FIREBASE_DATABASE_URL        (optional — for Realtime DB)
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'
import { getDatabase, type Database } from 'firebase-admin/database'

let _app: App | undefined

function getAdminApp(): App {
  if (_app) return _app
  if (getApps().length) {
    _app = getApps()[0]!
    return _app
  }

  const config = useRuntimeConfig()
  const privateKey = (config.firebaseAdminPrivateKey as string)
    ?.replace(/\\n/g, '\n') // Vercel stores newlines escaped

  if (!privateKey || !config.firebaseAdminClientEmail || !config.firebaseAdminProjectId) {
    throw new Error(
      '[firebase-admin] Missing credentials. Set FIREBASE_ADMIN_PROJECT_ID, '
      + 'FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in your .env'
    )
  }

  _app = initializeApp({
    credential: cert({
      projectId: config.firebaseAdminProjectId as string,
      clientEmail: config.firebaseAdminClientEmail as string,
      privateKey
    }),
    ...(config.firebaseDatabaseUrl
      ? { databaseURL: config.firebaseDatabaseUrl as string }
      : {})
  })

  return _app
}

/** Firestore instance (Admin) */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}

/** Auth instance (Admin) — for verifying ID tokens */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

/** Messaging instance (Admin) — for sending push notifications */
export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp())
}

/** Realtime Database instance (Admin) — for live rankings */
export function getAdminRtdb(): Database {
  return getDatabase(getAdminApp())
}
