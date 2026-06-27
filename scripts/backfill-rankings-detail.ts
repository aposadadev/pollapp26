import { readFileSync } from 'fs'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getDatabase } from 'firebase-admin/database'

// Cargar variables de entorno desde .env
function loadEnv() {
  try {
    const env = readFileSync('.env', 'utf-8')
    env.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length && !key.startsWith('#')) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    })
  } catch {
    // env file not found — ignore
  }
}
loadEnv()

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const databaseURL = process.env.FIREBASE_DATABASE_URL

if (!projectId || !clientEmail || !privateKey || !databaseURL) {
  console.error('❌ ERROR: Faltan credenciales o configuración de Firebase en .env (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_DATABASE_URL)')
  process.exit(1)
}

// Inicializar Admin SDK
const app = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      }),
      databaseURL
    })

const adminDb = getFirestore(app)
const adminRtdb = getDatabase(app)

async function main() {
  console.log('🔄 Iniciando backfill de rankings_detail en Realtime Database...')

  try {
    // 1. Obtener todas las boards activas
    console.log('🔍 Consultando boards activas en Firestore...')
    const boardsSnap = await adminDb.collection('boards')
      .where('isActive', '==', true)
      .get()

    if (boardsSnap.empty) {
      console.log('⚠️ No se encontraron boards activas.')
      process.exit(0)
    }

    const boards = boardsSnap.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      userDisplayName: doc.data().userDisplayName
    }))

    console.log(`✅ Se encontraron ${boards.length} boards activas. Procesando predicciones...`)

    // 2. Procesar predicciones por cada board
    let processedCount = 0
    const rtdbUpdates: Record<string, unknown> = {}

    for (const board of boards) {
      console.log(`⏳ Procesando board de: ${board.userDisplayName} (${board.id})...`)

      const predsSnap = await adminDb.collection('predictions')
        .where('boardId', '==', board.id)
        .where('points', '>', 0)
        .get()

      const history = predsSnap.docs.map((doc) => {
        const data = doc.data()
        return {
          matchId: data.matchId as string,
          localGoalPrediction: data.localGoalPrediction as number | null,
          visitorGoalPrediction: data.visitorGoalPrediction as number | null,
          points: data.points as number
        }
      })

      rtdbUpdates[`rankings_detail/${board.id}`] = {
        updatedAt: Date.now(),
        history
      }

      processedCount++
    }

    // 3. Escribir todas las actualizaciones en RTDB de una sola vez
    console.log('💾 Escribiendo datos en Realtime Database...')
    await adminRtdb.ref().update(rtdbUpdates)

    console.log(`\n🎉 ¡Backfill completado con éxito! Se procesaron ${processedCount} boards.`)
    process.exit(0)
  } catch (err: unknown) {
    console.error('❌ Error al procesar el backfill:', (err as Error).message)
    process.exit(1)
  }
}

main()
