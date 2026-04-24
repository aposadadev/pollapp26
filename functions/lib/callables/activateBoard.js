/**
 * activateBoard — Callable Function
 *
 * Activa una tabla pendiente y crea todas las predicciones vacías en batch.
 * Solo puede ser invocada por admins (validado con custom claims).
 *
 * Payload: { boardId: string, tournamentId: string }
 */
import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

const db = () => admin.firestore()
export const activateBoard = onCall(async (request) => {
  // Validar autenticación y rol admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.')
  }
  if (!request.auth.token['admin']) {
    throw new HttpsError('permission-denied', 'Solo los administradores pueden activar tablas.')
  }
  const { boardId, tournamentId } = request.data
  if (!boardId || !tournamentId) {
    throw new HttpsError('invalid-argument', 'boardId y tournamentId son requeridos.')
  }
  const boardRef = db().collection('boards').doc(boardId)
  const boardSnap = await boardRef.get()
  if (!boardSnap.exists) {
    throw new HttpsError('not-found', 'Tabla no encontrada.')
  }
  const board = boardSnap.data()
  if (board['isActive']) {
    throw new HttpsError('already-exists', 'La tabla ya está activa.')
  }
  // Obtener todos los partidos del torneo
  const matchesSnap = await db()
    .collection('matches')
    .where('tournamentId', '==', tournamentId)
    .get()
  if (matchesSnap.empty) {
    throw new HttpsError('failed-precondition', 'No hay partidos cargados para este torneo.')
  }
  // Crear predicciones vacías en chunks de 500 (límite de Firestore batch)
  const matchIds = matchesSnap.docs.map(d => d.id)
  const CHUNK_SIZE = 499
  for (let i = 0; i < matchIds.length; i += CHUNK_SIZE) {
    const chunk = matchIds.slice(i, i + CHUNK_SIZE)
    const batch = db().batch()
    for (const matchId of chunk) {
      const predRef = db().collection('predictions').doc()
      batch.set(predRef, {
        boardId,
        matchId,
        localGoalPrediction: null,
        visitorGoalPrediction: null,
        points: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    await batch.commit()
  }
  // Activar la tabla
  await boardRef.update({ isActive: true })
  return { success: true, boardId }
})
