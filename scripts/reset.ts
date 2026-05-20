/**
 * reset.ts — Vacía la app dejando los usuarios y el admin, pero reiniciando el juego.
 *
 * Usa Firebase Admin SDK para las eliminaciones y escrituras (evita errores de PERMISSION_DENIED)
 * y el SDK de cliente para validar la contraseña y el correo del administrador.
 *
 * Elimina:
 *   - Todos los grupos (groups)
 *   - Todos los boards (boards)
 *   - Todas las predicciones (predictions)
 *   - Todos los contadores internos (_counters)
 *   - Todos los partidos (matches)
 *   - Todos los equipos (teams)
 *   - Rankings en Realtime DB (/rankings)
 *
 * Conserva:
 *   - Todos los usuarios en Auth y Firestore (users)
 *
 * Ejecuta automáticamente al finalizar:
 *   - pnpm seed:tournament (para volver a crear equipos y partidos limpios)
 *
 * Uso:
 *   pnpm reset <password> <admin_email>
 *
 * Requiere: .env con las credenciales de Firebase y Firebase Admin SDK
 */
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app'
import { getAuth as getClientAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeApp as initAdminApp, cert, getApps as getAdminApps } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { getDatabase as getAdminDatabase } from 'firebase-admin/database'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// ── Env loader ─────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const env = readFileSync('.env', 'utf-8')
    env.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length && !key.startsWith('#')) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    })
  } catch { /* ignore */ }
}
loadEnv()

// ── Firebase Client SDK Config (para validación de contraseña del admin) ───────
const clientConfig = {
  apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID!
}

if (!clientConfig.apiKey || !clientConfig.projectId) {
  console.error('❌ Faltan credenciales públicas de Firebase en .env')
  process.exit(1)
}

const clientApp = getClientApps().length ? getClientApps()[0]! : initClientApp(clientConfig)
const clientAuth = getClientAuth(clientApp)

// ── Firebase Admin SDK Config (para operaciones privilegiadas de escritura/borrado) ──
const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const adminClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const adminPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const databaseURL = process.env.FIREBASE_DATABASE_URL

if (!adminProjectId || !adminClientEmail || !adminPrivateKey) {
  console.error('❌ ERROR: Faltan credenciales de Firebase Admin en .env (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)')
  process.exit(1)
}

const adminApp = getAdminApps().length
  ? getAdminApps()[0]!
  : initAdminApp({
      credential: cert({
        projectId: adminProjectId,
        clientEmail: adminClientEmail,
        privateKey: adminPrivateKey
      }),
      databaseURL
    })

const adminDb = getAdminFirestore(adminApp)
const adminRtdb = getAdminDatabase(adminApp)

// ── Config ─────────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.argv[2] // pasar como argumento: pnpm reset <password> <admin_email>
const ADMIN_EMAIL = process.argv[3]

// Colecciones a vaciar completamente
const COLLECTIONS_TO_CLEAR = ['groups', 'boards', 'predictions', '_counters', 'matches', 'teams']

// El primer board creado tras el reset tendrá este número
const BOARD_COUNTER_START = 1023 // próximo board = 1024

// ── Helpers ────────────────────────────────────────────────────────────────────

async function deleteCollection(collectionName: string): Promise<number> {
  const collectionRef = adminDb.collection(collectionName)
  const snap = await collectionRef.get()
  if (snap.empty) {
    console.log(`  ⚪ ${collectionName}: vacío`)
    return 0
  }

  // Borrar en lotes de 500 (límite de Firestore batch)
  const BATCH_SIZE = 500
  let deleted = 0

  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = adminDb.batch()
    const chunk = snap.docs.slice(i, i + BATCH_SIZE)
    chunk.forEach(d => batch.delete(d.ref))
    await batch.commit()
    deleted += chunk.length
  }

  console.log(`  🗑️  ${collectionName}: ${deleted} documentos eliminados`)
  return deleted
}

async function clearRankings(): Promise<void> {
  if (!databaseURL) {
    console.log('  ⚪ RTDB: no configurada la URL en .env, se omite')
    return
  }
  await adminRtdb.ref('rankings').remove()
  console.log('  🗑️  rankings (RTDB): eliminados')
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!ADMIN_PASSWORD || !ADMIN_EMAIL) {
    console.error('❌ ERROR: Faltan argumentos.')
    console.log('👉 Uso: pnpm reset <password> <admin_email>')
    process.exit(1)
  }

  console.log('\n🧹 Iniciando limpieza y reinicio de la app (vía Firebase Admin SDK)...')
  console.log(`   Admin a autenticar: ${ADMIN_EMAIL}`)
  console.log(`   Colecciones a vaciar: ${COLLECTIONS_TO_CLEAR.join(', ')}`)
  console.log(`   Colección a conservar intacta: users (usuarios y perfiles)\n`)

  // 0. Obtener UID del admin autenticándose en el SDK de cliente
  console.log('  🔑 Autenticando admin para obtener UID...')
  const cred = await signInWithEmailAndPassword(clientAuth, ADMIN_EMAIL, ADMIN_PASSWORD)
  const adminUid = cred.user.uid
  console.log(`  ✅ Admin UID: ${adminUid}\n`)

  // 1. Vaciar colecciones
  for (const col of COLLECTIONS_TO_CLEAR) {
    await deleteCollection(col)
  }

  // 1b. Inicializar contador de boards en 1023 → próximo board = #1024
  await adminDb.collection('_counters').doc('boards').set({ value: BOARD_COUNTER_START })
  console.log(`  ✅ _counters/boards: inicializado en ${BOARD_COUNTER_START} (próximo board = #${BOARD_COUNTER_START + 1})`)

  // 2. Asegurar que el documento del admin exista en Firestore y tenga isAdmin: true
  await adminDb.collection('users').doc(adminUid).set({
    id: adminUid,
    email: ADMIN_EMAIL,
    displayName: 'Admin',
    isAdmin: true,
    createdAt: new Date()
  }, { merge: true })
  console.log('  ✅ users/' + adminUid + ': documento admin garantizado (isAdmin: true)')

  // 3. Limpiar rankings en RTDB
  await clearRankings()

  // 4. Volver a poblar la data inicial de equipos y partidos (seeding)
  console.log('\n🌱 Ejecutando seed del torneo para restablecer calendario y equipos...')
  try {
    execSync('pnpm seed:tournament', { stdio: 'inherit' })
    console.log('  ✅ Seed del torneo ejecutado con éxito.')
  } catch (seedErr) {
    console.error('  ❌ Error ejecutando pnpm seed:tournament:', seedErr)
    process.exit(1)
  }

  console.log('\n✅ Reinicio y limpieza completados.')
  console.log('   La app está lista con:')
  console.log(`   • Todos los usuarios y perfiles intactos (incluyendo ${ADMIN_EMAIL})`)
  console.log('   • Calendario de partidos y equipos restablecido a su estado inicial')
  console.log('   • Sin grupos, boards, predicciones ni rankings (desde cero)\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌ Error durante la limpieza:', err)
  process.exit(1)
})
