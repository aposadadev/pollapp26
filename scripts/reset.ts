/**
 * reset.ts — Vacía la app dejando solo el admin y los datos del torneo.
 *
 * Elimina:
 *   - Todos los usuarios excepto el admin especificado
 *   - Todos los grupos (groups)
 *   - Todos los boards (boards)
 *   - Todas las predicciones (predictions)
 *   - Todos los contadores internos (_counters)
 *   - Rankings en Realtime DB (/rankings)
 *
 * Conserva:
 *   - Usuario admin (andres.posada0919@gmail.com)
 *   - Colección matches
 *   - Colección teams
 *
 * Uso:
 *   pnpm reset
 *
 * Requiere: .env con las credenciales de Firebase
 */
import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch
} from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getDatabase, ref as rtdbRef, remove } from 'firebase/database'
import { readFileSync } from 'fs'

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

const firebaseConfig = {
  apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID!,
  databaseURL: process.env.NUXT_PUBLIC_FIREBASE_DATABASE_URL
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Faltan credenciales de Firebase en .env')
  process.exit(1)
}

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const rtdb = firebaseConfig.databaseURL ? getDatabase(app) : null

// ── Config ─────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'andres.posada0919@gmail.com'
const ADMIN_PASSWORD = process.argv[2] // pasar como argumento: npm run reset -- <password>

// Colecciones a vaciar completamente
const COLLECTIONS_TO_CLEAR = ['groups', 'boards', 'predictions', '_counters']

// El primer board creado tras el reset tendrá este número
const BOARD_COUNTER_START = 1023 // próximo board = 1024

// Colecciones a mantener intactas
// const COLLECTIONS_TO_KEEP = ['matches', 'teams']

// ── Helpers ────────────────────────────────────────────────────────────────────

async function deleteCollection(collectionName: string): Promise<number> {
  const snap = await getDocs(collection(db, collectionName))
  if (snap.empty) {
    console.log(`  ⚪ ${collectionName}: vacío`)
    return 0
  }

  // Borrar en lotes de 500 (límite de Firestore batch)
  const BATCH_SIZE = 500
  let deleted = 0

  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = snap.docs.slice(i, i + BATCH_SIZE)
    chunk.forEach(d => batch.delete(d.ref))
    await batch.commit()
    deleted += chunk.length
  }

  console.log(`  🗑️  ${collectionName}: ${deleted} documentos eliminados`)
  return deleted
}

async function deleteNonAdminUsers(adminUid: string): Promise<number> {
  const snap = await getDocs(collection(db, 'users'))
  if (snap.empty) {
    console.log('  ⚪ users: vacío')
    return 0
  }

  // Filtrar por UID del documento, no por campo email (más confiable)
  const toDelete = snap.docs.filter(d => d.id !== adminUid)

  if (!toDelete.length) {
    console.log('  ⚪ users: solo existe el admin, nada que borrar')
    return 0
  }

  const BATCH_SIZE = 500
  let deleted = 0

  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = toDelete.slice(i, i + BATCH_SIZE)
    chunk.forEach(d => batch.delete(d.ref))
    await batch.commit()
    deleted += chunk.length
  }

  console.log(`  🗑️  users: ${deleted} usuario(s) eliminados (admin conservado)`)
  return deleted
}

async function clearRankings(): Promise<void> {
  if (!rtdb) {
    console.log('  ⚪ RTDB: no configurado, se omite')
    return
  }
  await remove(rtdbRef(rtdb, 'rankings'))
  console.log('  🗑️  rankings (RTDB): eliminados')
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error('❌ Debes pasar la contraseña del admin: npm run reset -- <password>')
    process.exit(1)
  }

  console.log('\n🧹 Iniciando limpieza de la app...')
  console.log(`   Admin a conservar: ${ADMIN_EMAIL}`)
  console.log(`   Colecciones intactas: matches, teams\n`)

  // 0. Obtener UID del admin autenticándose
  console.log('  🔑 Autenticando admin para obtener UID...')
  const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
  const adminUid = cred.user.uid
  console.log(`  ✅ Admin UID: ${adminUid}\n`)

  // 1. Vaciar colecciones
  for (const col of COLLECTIONS_TO_CLEAR) {
    await deleteCollection(col)
  }

  // 1b. Inicializar contador de boards en 1023 → próximo board = #1024
  await setDoc(doc(db, '_counters', 'boards'), { value: BOARD_COUNTER_START })
  console.log(`  ✅ _counters/boards: inicializado en ${BOARD_COUNTER_START} (próximo board = #${BOARD_COUNTER_START + 1})`)

  // 2. Borrar usuarios no-admin (filtrando por UID, no por campo email)
  await deleteNonAdminUsers(adminUid)

  // 2b. Asegurar que el documento del admin exista en Firestore
  await setDoc(doc(db, 'users', adminUid), {
    id: adminUid,
    email: ADMIN_EMAIL,
    displayName: 'Admin',
    createdAt: new Date()
  }, { merge: true })
  console.log('  ✅ users/' + adminUid + ': documento admin garantizado')

  // 3. Limpiar rankings en RTDB
  await clearRankings()

  console.log('\n✅ Limpieza completada.')
  console.log('   La app está lista con:')
  console.log(`   • 1 usuario admin (${ADMIN_EMAIL})`)
  console.log('   • Partidos y equipos intactos')
  console.log('   • Sin grupos, boards, predicciones ni rankings\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌ Error durante la limpieza:', err)
  process.exit(1)
})
