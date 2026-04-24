/**
 * backfill-match-visibility.ts — Backfill idempotente del campo `visible` en matches
 *
 * Garantiza que todos los documentos de la colección `matches` tengan el campo
 * `visible` (boolean), derivándolo de la fase y los equipos si faltara.
 *
 * ── SUPUESTOS DE NORMALIZACIÓN ──────────────────────────────────────────────
 *
 *  1. Si el documento ya tiene `visible` (true o false) → NO SE MODIFICA.
 *     (Respeta cambios manuales de admin y el backfill existente de status.)
 *
 *  2. Si `visible` falta, se aplica la siguiente heurística:
 *
 *     a) Fase de Grupos: siempre visible=true.
 *        Los partidos de grupo siempre tienen equipos reales definidos.
 *
 *     b) Fases eliminatorias (Octavos, Cuartos, Semifinales, Tercer Lugar, Final):
 *        - visible=false si localTeamId === visitorTeamId
 *          (indica placeholder TBD vs TBD del seed; mismo ID de equipo en ambos slots)
 *        - visible=false si localTeamName === 'TBD' o visitorTeamName === 'TBD'
 *          (indica que el nombre cacheado es el placeholder)
 *        - visible=true en cualquier otro caso
 *          (equipos distintos, probablemente reales)
 *
 *  3. Si la fase del documento no coincide con ninguna conocida → visible=true
 *     (conservador, no ocultamos datos inesperados)
 *
 * ── COMPATIBILIDAD CON BACKFILL PREVIO ──────────────────────────────────────
 *
 *  Este script NO toca el campo `status`. Es completamente independiente del
 *  script `backfill-match-status.ts`. Ambos pueden ejecutarse en cualquier orden.
 *
 * Uso:
 *   pnpm backfill:match-visibility           # dry-run (no escribe nada)
 *   pnpm backfill:match-visibility --apply   # aplica cambios en Firestore
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
type MatchPhase
  = 'Fase de Grupos'
    | 'Octavos de Final'
    | 'Cuartos de Final'
    | 'Semifinales'
    | 'Tercer Lugar'
    | 'Final'

const ELIMINATION_PHASES: ReadonlySet<string> = new Set([
  'Octavos de Final',
  'Cuartos de Final',
  'Semifinales',
  'Tercer Lugar',
  'Final'
])

interface MatchData {
  visible?: boolean
  phase?: MatchPhase | string
  localTeamId?: string
  visitorTeamId?: string
  localTeamName?: string
  visitorTeamName?: string
  [key: string]: unknown
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Determina el valor de `visible` para un match sin ese campo.
 *
 * Heurística documentada en el header del archivo.
 */
function deriveVisible(data: MatchData): boolean {
  const phase = data.phase ?? ''

  // Fase de grupos → siempre visible
  if (!ELIMINATION_PHASES.has(phase)) {
    return true
  }

  // Fases eliminatorias — verificar si los equipos son placeholder
  const sameTeamId
    = data.localTeamId
      && data.visitorTeamId
      && data.localTeamId === data.visitorTeamId

  const hasTBDName
    = data.localTeamName === 'TBD'
      || data.visitorTeamName === 'TBD'

  if (sameTeamId || hasTBDName) {
    return false // placeholder → oculto
  }

  return true // equipos reales → visible
}

// ── Main ──────────────────────────────────────────────────────────────────────
const DRY_RUN = !process.argv.includes('--apply')

async function run() {
  console.log('')
  console.log('════════════════════════════════════════════════')
  console.log('  backfill-match-visibility')
  console.log(`  Modo: ${DRY_RUN ? '🔍 DRY-RUN (sin escrituras)' : '✏️  APPLY (escribiendo en Firestore)'}`)
  console.log('════════════════════════════════════════════════')
  console.log('')

  const matchesRef = collection(db, 'matches')
  const snapshot = await getDocs(matchesRef)

  const total = snapshot.docs.length
  let alreadyOk = 0
  let toUpdate = 0
  const updates: Array<{ id: string, derivedVisible: boolean, phase?: string, reason: string }> = []

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as MatchData
    const id = docSnap.id

    if (data.visible !== undefined && data.visible !== null) {
      alreadyOk++
      console.log(`  ✅ [${id}] phase="${data.phase}" visible=${data.visible} — ya tiene visible, sin cambios`)
      continue
    }

    const derivedVisible = deriveVisible(data)
    const reason = ELIMINATION_PHASES.has(data.phase ?? '')
      ? (derivedVisible ? 'eliminatoria con equipos reales' : 'eliminatoria placeholder (TBD)')
      : 'fase de grupos'

    toUpdate++
    updates.push({ id, derivedVisible, phase: data.phase, reason })
    console.log(
      `  🔄 [${id}] phase="${data.phase ?? 'unknown'}" local="${data.localTeamName ?? data.localTeamId ?? '?'}" `
      + `visitor="${data.visitorTeamName ?? data.visitorTeamId ?? '?'}" `
      + `→ visible=${derivedVisible} (${reason})${DRY_RUN ? ' — DRY-RUN' : ''}`
    )
  }

  console.log('')
  console.log('────────────────────────────────────────────────')
  console.log(`  Total documentos:  ${total}`)
  console.log(`  Ya tienen visible: ${alreadyOk}`)
  console.log(`  Requieren update:  ${toUpdate}`)
  if (toUpdate > 0) {
    const hidden = updates.filter(u => !u.derivedVisible).length
    const visible = updates.filter(u => u.derivedVisible).length
    console.log(`    → visible=true:  ${visible}`)
    console.log(`    → visible=false: ${hidden}`)
  }
  console.log('────────────────────────────────────────────────')

  if (DRY_RUN) {
    if (toUpdate > 0) {
      console.log('')
      console.log('  💡 Ejecuta con --apply para aplicar estos cambios:')
      console.log('     pnpm backfill:match-visibility --apply')
    } else {
      console.log('')
      console.log('  🎉 Todos los documentos ya tienen visible. Nada que hacer.')
    }
    console.log('')
    process.exit(0)
  }

  // Apply mode — write in batches of 500 (Firestore limit)
  if (toUpdate === 0) {
    console.log('')
    console.log('  🎉 Todos los documentos ya tienen visible. Nada que hacer.')
    console.log('')
    process.exit(0)
  }

  const BATCH_SIZE = 500
  let written = 0

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = updates.slice(i, i + BATCH_SIZE)
    for (const { id, derivedVisible } of chunk) {
      batch.update(doc(db, 'matches', id), { visible: derivedVisible })
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
