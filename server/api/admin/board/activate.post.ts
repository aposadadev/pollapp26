import { FieldValue } from 'firebase-admin/firestore'

interface ActivateBoardBody {
  boardId: string
  tournamentId: string
}

export default defineEventHandler(async (event) => {
  // 1. Validar que el usuario sea administrador
  await requireAdmin(event)

  const body = await readBody<ActivateBoardBody>(event)
  const { boardId, tournamentId } = body ?? {}

  if (!boardId || !tournamentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'boardId y tournamentId son requeridos.'
    })
  }

  const db = getAdminDb()

  // 2. Obtener la tabla y verificar que exista y no esté ya activa
  const boardRef = db.collection('boards').doc(boardId)
  const boardSnap = await boardRef.get()

  if (!boardSnap.exists) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tabla no encontrada.'
    })
  }

  const board = boardSnap.data()!
  if (board.isActive) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La tabla ya está activa.'
    })
  }

  // 3. Obtener todos los partidos de este torneo
  const matchesSnap = await db
    .collection('matches')
    .where('tournamentId', '==', tournamentId)
    .get()

  if (matchesSnap.empty) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No hay partidos cargados para este torneo.'
    })
  }

  // 4. Crear predicciones vacías en chunks (límite de 500 por batch en Firestore)
  const matchIds = matchesSnap.docs.map(d => d.id)
  const CHUNK_SIZE = 450

  for (let i = 0; i < matchIds.length; i += CHUNK_SIZE) {
    const chunk = matchIds.slice(i, i + CHUNK_SIZE)
    const batch = db.batch()
    for (const matchId of chunk) {
      const predRef = db.collection('predictions').doc()
      batch.set(predRef, {
        boardId,
        matchId,
        localGoalPrediction: null,
        visitorGoalPrediction: null,
        points: 0,
        createdAt: FieldValue.serverTimestamp()
      })
    }
    await batch.commit()
  }

  // 5. Activar la tabla
  await boardRef.update({ isActive: true })

  return { success: true, boardId }
})
