/**
 * seed-test.ts — Datos de prueba completos (sin firebase-admin)
 *
 * Usa el SDK del cliente + Firebase Auth REST API.
 * No requiere serviceAccountKey.json.
 *
 * Uso:
 *   pnpm seed:test           — crea todos los datos
 *   pnpm seed:clean          — borra datos de prueba (colecciones + RTDB)
 *
 * ⚠️  Crea usuarios reales en Firebase Auth. Contraseña: Test1234!
 */
import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  writeBatch,
  getDocs,
  query,
  where
} from 'firebase/firestore'
import { getDatabase, ref as rtdbRef, set } from 'firebase/database'
import { readFileSync } from 'fs'

// ── Env loader ────────────────────────────────────────────────────────────────
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
  databaseURL: process.env.NUXT_PUBLIC_FIREBASE_DATABASE_URL!
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ ERROR: Faltan credenciales de Firebase en .env')
  process.exit(1)
}

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
const db = getFirestore(app)
const rtdb = firebaseConfig.databaseURL ? getDatabase(app) : null

const TOURNAMENT_ID = 'mundial2026'
const PASSWORD = 'Test1234!'
const isClean = process.argv.includes('--clean')

// ── Usuarios de prueba ────────────────────────────────────────────────────────
const TEST_USERS = [
  { email: 'admin@polla.com', firstName: 'Admin', lastName: 'Polla', isAdmin: true },
  { email: 'test1@polla.com', firstName: 'Carlos', lastName: 'Rodríguez', isAdmin: false },
  { email: 'test2@polla.com', firstName: 'María', lastName: 'González', isAdmin: false },
  { email: 'test3@polla.com', firstName: 'Juan', lastName: 'Martínez', isAdmin: false },
  { email: 'test4@polla.com', firstName: 'Ana', lastName: 'López', isAdmin: false }
]

const TEST_GROUPS = [
  { name: 'Amigos del Fútbol', code: 'AMIGOS' },
  { name: 'Familia 2026', code: 'FAM26' },
  { name: 'Oficina', code: 'TRABAJO' }
]

// Predicciones por usuario: [localGoals, visitorGoals] por partido (primeros 10)
const PREDICTIONS_BY_USER: Array<Array<[number, number]>> = [
  [[2, 1], [1, 0], [2, 0], [3, 1], [1, 1], [2, 2], [1, 0], [0, 1], [1, 2], [2, 1]],
  [[2, 1], [0, 1], [1, 0], [2, 0], [1, 1], [1, 2], [2, 0], [1, 1], [0, 0], [1, 0]],
  [[1, 0], [1, 0], [0, 2], [1, 1], [2, 1], [0, 1], [1, 0], [2, 0], [1, 1], [0, 1]],
  [[0, 2], [2, 0], [1, 2], [0, 1], [1, 0], [3, 0], [0, 2], [1, 0], [2, 1], [0, 0]],
  [[3, 0], [0, 3], [2, 2], [0, 0], [3, 1], [2, 0], [1, 3], [0, 2], [3, 0], [2, 2]]
]

// Resultados reales de los primeros 9 partidos (el 10 está abierto)
const MATCH_RESULTS: Array<[number, number] | null> = [
  [2, 1], [1, 0], [0, 1], [1, 1], [2, 0],
  [1, 2], [2, 1], [1, 1], [0, 2], null
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getOutcome(l: number, v: number) {
  if (l > v) return 'local'
  if (v > l) return 'visitor'
  return 'draw'
}

function calcPoints(pred: [number, number], actual: [number, number]): 0 | 1 | 3 {
  if (pred[0] === actual[0] && pred[1] === actual[1]) return 3
  if (getOutcome(pred[0], pred[1]) === getOutcome(actual[0], actual[1])) return 1
  return 0
}

// ── Crear usuario vía Firebase Auth REST API ──────────────────────────────────
async function createOrGetUser(email: string, firstName: string, lastName: string): Promise<{ uid: string, isNew: boolean }> {
  // Intentar sign-in primero (puede que ya exista)
  const signInRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true })
    }
  )

  if (signInRes.ok) {
    const data = await signInRes.json() as { localId: string }
    return { uid: data.localId, isNew: false }
  }

  // No existe → crear
  const signUpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: PASSWORD,
        displayName: `${firstName} ${lastName}`,
        returnSecureToken: true
      })
    }
  )

  if (!signUpRes.ok) {
    const err = await signUpRes.json() as { error: { message: string } }
    throw new Error(`Error creando usuario ${email}: ${err.error.message}`)
  }

  const data = await signUpRes.json() as { localId: string }
  return { uid: data.localId, isNew: true }
}

// ── Clean mode ────────────────────────────────────────────────────────────────
async function cleanTestData() {
  console.log('🧹 Limpiando datos de prueba...\n')

  const batch = writeBatch(db)
  let total = 0

  for (const col of ['groups', 'boards', 'predictions'] as const) {
    const snap = await getDocs(collection(db, col))
    snap.docs.forEach(d => batch.delete(d.ref))
    total += snap.docs.length
    console.log(`   ✓ '${col}' — ${snap.docs.length} docs`)
  }

  await batch.commit()
  console.log(`   → ${total} documentos eliminados`)

  if (rtdb) {
    await set(rtdbRef(rtdb, 'rankings'), null)
    console.log('   ✓ Rankings de RTDB eliminados')
  }

  console.log('\n⚠️  Usuarios de prueba NO se eliminan (requiere Admin SDK).')
  console.log('   Para eliminarlos, ve a Firebase Console → Authentication.\n')
  console.log('✅ Limpieza completada!\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (isClean) {
    await cleanTestData()
    return
  }

  console.log('🚀 Seed de datos de prueba\n')
  console.log(`   Proyecto: ${firebaseConfig.projectId}\n`)

  // 1. Obtener partidos existentes
  console.log('📋 Obteniendo partidos...')
  const matchesSnap = await getDocs(
    query(
      collection(db, 'matches'),
      where('tournamentId', '==', TOURNAMENT_ID)
    )
  )

  if (matchesSnap.empty) {
    console.error('❌ No hay partidos en la base de datos.')
    console.error('   Corre primero: pnpm seed:tournament')
    process.exit(1)
  }

  const matches = matchesSnap.docs
    .map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
    .sort((a, b) => (a['matchNumber'] as number) - (b['matchNumber'] as number))
  console.log(`   → ${matches.length} partidos\n`)

  // 2. Crear usuarios
  console.log('👥 Creando usuarios...')
  const userIds: string[] = []

  for (const u of TEST_USERS) {
    const { uid, isNew } = await createOrGetUser(u.email, u.firstName, u.lastName)
    userIds.push(uid)

    await setDoc(doc(db, 'users', uid), {
      displayName: `${u.firstName} ${u.lastName}`,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      isAdmin: u.isAdmin,
      createdAt: new Date()
    }, { merge: true })

    console.log(`   ${isNew ? '✓' : '~'} ${u.email}${isNew ? '' : ' (ya existe)'}`)
  }
  console.log(`   → ${userIds.length} usuarios listos\n`)

  // 3. Crear grupos
  console.log('🏆 Creando grupos...')
  const groupIds: string[] = []

  for (const g of TEST_GROUPS) {
    const ref = await addDoc(collection(db, 'groups'), {
      name: g.name,
      code: g.code,
      ownerId: userIds[0],
      ownerName: `${TEST_USERS[0].firstName} ${TEST_USERS[0].lastName}`,
      tournamentId: TOURNAMENT_ID,
      isActive: true,
      createdAt: new Date()
    })
    groupIds.push(ref.id)
    console.log(`   ✓ ${g.name} (${g.code})`)
  }
  console.log(`   → ${groupIds.length} grupos creados\n`)

  // 4. Crear boards activos
  console.log('📋 Creando boards...')
  const boardIds: string[][] = []
  let boardCounter = 1001

  for (let uIdx = 0; uIdx < userIds.length; uIdx++) {
    const ub: string[] = []
    for (let gIdx = 0; gIdx < groupIds.length; gIdx++) {
      const ref = await addDoc(collection(db, 'boards'), {
        userId: userIds[uIdx],
        userDisplayName: `${TEST_USERS[uIdx].firstName} ${TEST_USERS[uIdx].lastName}`,
        groupId: groupIds[gIdx],
        groupName: TEST_GROUPS[gIdx].name,
        tournamentId: TOURNAMENT_ID,
        number: boardCounter++,
        isActive: true,
        totalPoints: 0,
        predsThreePoints: 0,
        predsOnePoints: 0,
        currentPos: 0,
        previousPos: 0,
        createdAt: new Date()
      })
      ub.push(ref.id)
      process.stdout.write('.')
    }
    boardIds.push(ub)
  }
  console.log(`\n   → ${userIds.length * groupIds.length} boards creados\n`)

  // 5. Crear predicciones y calcular puntos
  console.log('🎯 Creando predicciones...')
  const activeMatches = matches.slice(0, 10)
  const boardStats = new Map<string, { total: number, three: number, one: number }>()

  for (let uIdx = 0; uIdx < userIds.length; uIdx++) {
    const preds = PREDICTIONS_BY_USER[uIdx]

    for (let gIdx = 0; gIdx < groupIds.length; gIdx++) {
      const boardId = boardIds[uIdx][gIdx]
      let total = 0, three = 0, one = 0

      const batch = writeBatch(db)

      for (let mIdx = 0; mIdx < activeMatches.length; mIdx++) {
        const match = activeMatches[mIdx]
        const pred = preds[mIdx] ?? [1, 0]
        const result = MATCH_RESULTS[mIdx]
        let points: 0 | 1 | 3 = 0

        if (result) {
          points = calcPoints(pred, result)
          total += points
          if (points === 3) three++
          if (points === 1) one++
        }

        const predRef = doc(collection(db, 'predictions'))
        batch.set(predRef, {
          boardId,
          matchId: match.id,
          localGoalPrediction: pred[0],
          visitorGoalPrediction: pred[1],
          points,
          createdAt: new Date()
        })
      }

      // Predicciones vacías para partidos restantes
      for (let mIdx = activeMatches.length; mIdx < matches.length; mIdx++) {
        const predRef = doc(collection(db, 'predictions'))
        batch.set(predRef, {
          boardId,
          matchId: matches[mIdx].id,
          localGoalPrediction: null,
          visitorGoalPrediction: null,
          points: 0,
          createdAt: new Date()
        })
      }

      await batch.commit()
      boardStats.set(boardId, { total, three, one })
      process.stdout.write('.')
    }
  }
  console.log(`\n   → ${userIds.length * groupIds.length * matches.length} predicciones creadas\n`)

  // 6. Actualizar stats de boards
  console.log('📊 Actualizando stats de boards...')
  for (const [boardId, stats] of boardStats.entries()) {
    const ref = doc(db, 'boards', boardId)
    const batch = writeBatch(db)
    batch.update(ref, {
      totalPoints: stats.total,
      predsThreePoints: stats.three,
      predsOnePoints: stats.one
    })
    await batch.commit()
  }
  console.log('   ✓ Stats actualizados\n')

  // 7. Calcular y escribir ranking en RTDB
  console.log('🏅 Calculando rankings...')

  for (let gIdx = 0; gIdx < groupIds.length; gIdx++) {
    const groupId = groupIds[gIdx]

    const boardsWithStats = userIds.map((uid, uIdx) => {
      const boardId = boardIds[uIdx][gIdx]
      const stats = boardStats.get(boardId) ?? { total: 0, three: 0, one: 0 }
      return { uid, uIdx, boardId, stats }
    })

    boardsWithStats.sort((a, b) => {
      if (b.stats.total !== a.stats.total) return b.stats.total - a.stats.total
      if (b.stats.three !== a.stats.three) return b.stats.three - a.stats.three
      return b.stats.one - a.stats.one
    })

    const entries = boardsWithStats.map((entry, index) => ({
      boardId: entry.boardId,
      boardNumber: 1001 + entry.uIdx * groupIds.length + gIdx,
      userId: entry.uid,
      userDisplayName: `${TEST_USERS[entry.uIdx].firstName} ${TEST_USERS[entry.uIdx].lastName}`,
      totalPoints: entry.stats.total,
      predsThreePoints: entry.stats.three,
      predsOnePoints: entry.stats.one,
      currentPos: index + 1,
      previousPos: 0,
      positionDelta: 'same'
    }))

    // Escribe en RTDB si está configurado
    if (rtdb) {
      await set(rtdbRef(rtdb, `rankings/${groupId}`), {
        updatedAt: Date.now(),
        entries
      })
    }

    // Actualiza currentPos en Firestore
    const posBatch = writeBatch(db)
    entries.forEach((e) => {
      posBatch.update(doc(db, 'boards', e.boardId), { currentPos: e.currentPos })
    })
    await posBatch.commit()

    console.log(`\n   ${TEST_GROUPS[gIdx].name}:`)
    entries.forEach(e =>
      console.log(`      ${e.currentPos}. ${e.userDisplayName.padEnd(20)} ${String(e.totalPoints).padStart(3)} pts`)
    )
  }

  console.log('\n\n✅ Seed completado!\n')
  console.log('👤 Usuarios (contraseña: Test1234!):\n')
  TEST_USERS.forEach(u =>
    console.log(`   ${u.isAdmin ? '[ADMIN] ' : '        '}${u.email}`)
  )
  console.log('\n🏆 Grupos:\n')
  TEST_GROUPS.forEach(g =>
    console.log(`   ${g.code.padEnd(10)} — ${g.name}`)
  )
  console.log('')
}

main()
