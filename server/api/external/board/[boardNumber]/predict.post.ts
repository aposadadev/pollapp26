/**
 * POST /api/external/board/:boardNumber/predict
 *
 * Saves predictions for one or more matches on behalf of the authenticated user's board.
 * Returns a detailed summary of what was updated and what failed (with reasons).
 *
 * Authentication: API Key (Authorization: Bearer <key> or X-API-Key: <key>)
 *
 * Body (individual):
 *   {
 *     "matchId": "abc123",
 *     "localGoalPrediction": 2,
 *     "visitorGoalPrediction": 1
 *   }
 *
 * Body (bulk):
 *   {
 *     "predictions": [
 *       { "matchId": "abc123", "localGoalPrediction": 2, "visitorGoalPrediction": 1 },
 *       { "matchId": "def456", "localGoalPrediction": 0, "visitorGoalPrediction": 0 }
 *     ]
 *   }
 *
 * Response:
 *   {
 *     "summary": { "total": 2, "updated": 1, "failed": 1 },
 *     "results": [
 *       { "matchId": "abc123", "status": "success", "message": "Predicción guardada correctamente." },
 *       { "matchId": "def456", "status": "failed",  "message": "Las predicciones se cierran 30 minutos antes del partido." }
 *     ]
 *   }
 */
import { FieldValue } from 'firebase-admin/firestore'

interface PredictionInput {
  matchId: string
  localGoalPrediction: number
  visitorGoalPrediction: number
}

interface PredictBody {
  // Individual mode
  matchId?: string
  localGoalPrediction?: number
  visitorGoalPrediction?: number
  // Bulk mode
  predictions?: PredictionInput[]
}

interface PredictResult {
  matchId: string
  status: 'success' | 'failed'
  message: string
}

const PREDICTION_CUTOFF_MINUTES = 30

export default defineEventHandler(async (event) => {
  // 1. Authenticate via API key
  const { userId } = await requireApiKey(event)

  // 2. Resolve :boardNumber route param
  const boardNumberRaw = getRouterParam(event, 'boardNumber')
  const boardNumber = Number(boardNumberRaw)

  if (!boardNumberRaw || isNaN(boardNumber) || !Number.isInteger(boardNumber)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El parámetro boardNumber debe ser un número entero (ej: /api/external/board/1001/predict).'
    })
  }

  // 3. Normalize body to array of prediction inputs
  const body = await readBody<PredictBody>(event)

  let inputs: PredictionInput[] = []

  if (body?.predictions && Array.isArray(body.predictions)) {
    inputs = body.predictions
  } else if (body?.matchId !== undefined) {
    inputs = [{
      matchId: body.matchId,
      localGoalPrediction: body.localGoalPrediction!,
      visitorGoalPrediction: body.visitorGoalPrediction!
    }]
  }

  if (!inputs.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Proporciona predictions (array) o matchId + localGoalPrediction + visitorGoalPrediction en el body.'
    })
  }

  // 4. Validate each input — invalid entries go into results as failures, not 500 errors
  const results: PredictResult[] = []
  const validInputs: PredictionInput[] = []

  for (const input of inputs) {
    if (!input.matchId) {
      results.push({ matchId: input.matchId ?? '(sin matchId)', status: 'failed', message: 'Falta el campo matchId.' })
      continue
    }
    if (!Number.isInteger(input.localGoalPrediction) || input.localGoalPrediction < 0) {
      results.push({ matchId: input.matchId, status: 'failed', message: `localGoalPrediction inválido. Debe ser un entero >= 0, se recibió: ${JSON.stringify(input.localGoalPrediction)}.` })
      continue
    }
    if (!Number.isInteger(input.visitorGoalPrediction) || input.visitorGoalPrediction < 0) {
      results.push({ matchId: input.matchId, status: 'failed', message: `visitorGoalPrediction inválido. Debe ser un entero >= 0, se recibió: ${JSON.stringify(input.visitorGoalPrediction)}.` })
      continue
    }
    validInputs.push(input)
  }

  // If every single input was invalid, return early with the summary
  if (!validInputs.length) {
    return {
      boardNumber,
      summary: { total: results.length, updated: 0, failed: results.length },
      results
    }
  }

  const db = getAdminDb()

  // 5. Find & validate the board belongs to the authenticated user
  const boardsSnap = await db
    .collection('boards')
    .where('userId', '==', userId)
    .where('number', '==', boardNumber)
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (boardsSnap.empty) {
    throw createError({
      statusCode: 404,
      statusMessage: `No se encontró una tabla activa con número ${boardNumber} asociada a tu cuenta.`
    })
  }

  const boardDoc = boardsSnap.docs[0]!
  const boardId = boardDoc.id
  const tournamentId = boardDoc.data()['tournamentId'] as string ?? 'mundial2026'

  // 6. Fetch all relevant matches in bulk (avoid N+1)
  const matchIds = [...new Set(validInputs.map(i => i.matchId))]
  const matchDocs = await Promise.all(
    matchIds.map(id => db.collection('matches').doc(id).get())
  )
  const matchMap = new Map(
    matchDocs.map(d => [d.id, d.exists ? d.data() : null])
  )

  // 7. Fetch existing predictions for this board in bulk
  const predsSnap = await db
    .collection('predictions')
    .where('boardId', '==', boardId)
    .get()
  const predMap = new Map(
    predsSnap.docs.map(d => [d.data()['matchId'] as string, d.id])
  )

  // 8. Process each valid prediction individually
  const now = new Date()

  for (const input of validInputs) {
    const { matchId, localGoalPrediction, visitorGoalPrediction } = input
    const matchData = matchMap.get(matchId)

    if (!matchData) {
      results.push({ matchId, status: 'failed', message: `El partido ${matchId} no existe.` })
      continue
    }

    if ((matchData['tournamentId'] as string) !== tournamentId) {
      results.push({ matchId, status: 'failed', message: `El partido ${matchId} no pertenece al torneo de tu tabla.` })
      continue
    }

    if (matchData['visible'] === false) {
      results.push({ matchId, status: 'failed', message: `El partido ${matchId} aún no está disponible.` })
      continue
    }

    const status = matchData['status'] as string ?? (matchData['isClosed'] ? 'closed' : matchData['isActive'] ? 'active' : 'scheduled')

    if (status === 'closed') {
      results.push({ matchId, status: 'failed', message: 'El partido ya ha finalizado. No puedes modificar tu predicción.' })
      continue
    }

    if (status === 'active') {
      results.push({ matchId, status: 'failed', message: 'El partido ya está en curso. No puedes modificar tu predicción.' })
      continue
    }

    const matchDate = (matchData['date'] as FirebaseFirestore.Timestamp).toDate()
    const cutoff = new Date(matchDate.getTime() - PREDICTION_CUTOFF_MINUTES * 60 * 1000)
    if (now >= cutoff) {
      results.push({ matchId, status: 'failed', message: `Las predicciones se cerraron 30 minutos antes del partido (${matchDate.toISOString()}).` })
      continue
    }

    try {
      const existingPredId = predMap.get(matchId)
      if (existingPredId) {
        await db.collection('predictions').doc(existingPredId).update({
          localGoalPrediction,
          visitorGoalPrediction,
          updatedAt: FieldValue.serverTimestamp()
        })
      } else {
        await db.collection('predictions').add({
          boardId,
          matchId,
          localGoalPrediction,
          visitorGoalPrediction,
          points: 0,
          createdAt: FieldValue.serverTimestamp()
        })
      }
      results.push({ matchId, status: 'success', message: 'Predicción guardada correctamente.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ matchId, status: 'failed', message: `Error al guardar: ${message}` })
    }
  }

  // 9. Build summary
  const updated = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed').length

  return {
    boardNumber,
    summary: { total: results.length, updated, failed },
    results
  }
})
