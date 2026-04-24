/**
 * backfill-match-status.ts — Backfill idempotente del campo `status` en matches
 *
 * Garantiza que todos los documentos de la colección `matches` tengan el campo
 * `status` ('scheduled' | 'active' | 'closed'), derivándolo de los campos legacy
 * `isClosed` e `isActive` si faltara.
 *
 * Reglas de derivación:
 *   - isClosed == true           → status = 'closed'
 *   - isActive == true           → status = 'active'
 *   - ninguno / ambos false      → status = 'scheduled'
 *
 * El script es IDEMPOTENTE: documentos que ya tienen `status` NO se modifican.
 *
 * Uso:
 *   pnpm backfill:match-status           # dry-run (no escribe nada)
 *   pnpm backfill:match-status --apply   # aplica cambios en Firestore
 *
 * Requiere: .env con las credenciales de Firebase
 */
import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc
} from 'firebase/firestore'
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

// ── Firebase init ──────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID!
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌  Faltan credenciales de Firebase en .env')
  process.exit(1)
}

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
const db = getFirestore(app)

// ── Types ─────────────────────────────────────────────────────────────────────
type MatchStatus = 'scheduled' | 'active' | 'closed'

interface MatchData {
  status?: MatchStatus
  isClosed?: boolean
  isActive?: boolean
  [key: string]: unknown
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function deriveStatus(data: MatchData): MatchStatus {
  if (data.isClosed === true) return 'closed'
  if (data.isActive === true) return 'active'
  return 'scheduled'
}

// ── Main ──────────────────────────────────────────────────────────────────────
const DRY_RUN = !process.argv.includes('--apply')

async function run() {
  console.log('')
  console.log('════════════════════════════════════════════════')
  console.log('  backfill-match-status')
  console.log(`  Modo: ${DRY_RUN ? '🔍 DRY-RUN (sin escrituras)' : '✏️  APPLY (escribiendo en Firestore)'}`)
  console.log('════════════════════════════════════════════════')
  console.log('')

  const matchesRef = collection(db, 'matches')
  const snapshot = await getDocs(matchesRef)

  const total = snapshot.docs.length
  let alreadyOk = 0
  let toUpdate = 0
  const updates: Array<{ id: string, derivedStatus: MatchStatus, isClosed?: boolean, isActive?: boolean }> = []

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as MatchData
    const id = docSnap.id

    if (data.status !== undefined && data.status !== null) {
      alreadyOk++
      console.log(`  ✅ [${id}] status="${data.status}" — ya tiene status, sin cambios`)
      continue
    }

    const derivedStatus = deriveStatus(data)
    toUpdate++
    updates.push({ id, derivedStatus, isClosed: data.isClosed, isActive: data.isActive })
    console.log(
      `  🔄 [${id}] isClosed=${data.isClosed ?? 'undef'} isActive=${data.isActive ?? 'undef'}`
      + ` → status="${derivedStatus}"${DRY_RUN ? ' (DRY-RUN, no escrito)' : ''}`
    )
  }

  console.log('')
  console.log('────────────────────────────────────────────────')
  console.log(`  Total documentos:  ${total}`)
  console.log(`  Ya tienen status:  ${alreadyOk}`)
  console.log(`  Requieren update:  ${toUpdate}`)
  console.log('────────────────────────────────────────────────')

  if (DRY_RUN) {
    if (toUpdate > 0) {
      console.log('')
      console.log('  💡 Ejecuta con --apply para aplicar estos cambios:')
      console.log('     pnpm backfill:match-status --apply')
    } else {
      console.log('')
      console.log('  🎉 Todos los documentos ya tienen status. Nada que hacer.')
    }
    console.log('')
    process.exit(0)
  }

  // Apply mode — write in batches of 500 (Firestore limit)
  if (toUpdate === 0) {
    console.log('')
    console.log('  🎉 Todos los documentos ya tienen status. Nada que hacer.')
    console.log('')
    process.exit(0)
  }

  const BATCH_SIZE = 500
  let written = 0

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = updates.slice(i, i + BATCH_SIZE)
    for (const { id, derivedStatus } of chunk) {
      batch.update(doc(db, 'matches', id), { status: derivedStatus })
    }
    await batch.commit()
    written += chunk.length
    console.log(`  📦 Batch commit: ${written}/${toUpdate} documentos escritos`)
  }

  console.log('')
  console.log(`  ✅ Backfill completado. ${written} documentos actualizados.`)
  console.log('')
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Error inesperado:', err)
  process.exit(1)
})
