/**
 * onMatchClosed — Trigger de Firestore
 *
 * Se dispara cuando un documento en /matches/{matchId} cambia a isClosed = true.
 * Recalcula puntos, board stats y posiciones en todos los grupos afectados.
 * Escribe el nuevo ranking en Realtime DB.
 *
 * Esto es un fallback / alternativa al flujo cliente. Si usas matchService.closeMatch()
 * desde el admin web, este trigger también se ejecutará (idempotencia garantizada
 * porque sólo actúa cuando isClosed pasa de false a true).
 */
import * as admin from 'firebase-admin'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { calculatePoints } from '../services/scoring.service.js'
import { recalculate, toBoardUpdates } from '../services/ranking.service.js'

const db = () => admin.firestore()
const rtdb = () => admin.database()

export const onMatchClosed = onDocumentUpdated(
  'matches/{matchId}',
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    const matchId = event.params.matchId

    // Solo actuar si acaba de cerrarse
    if (!after || !after['isClosed'] || before?.['isClosed']) return

    const localGoals = after['localGoals'] as number
    const visitorGoals = after['visitorGoals'] as number

    // 1. Obtener predicciones del partido
    const predsSnap = await db()
      .collection('predictions')
      .where('matchId', '==', matchId)
      .get()

    if (predsSnap.empty) return

    const batch1 = db().batch()
    const affectedBoardIds = new Set<string>()

    // 2. Calcular y actualizar puntos
    for (const doc of predsSnap.docs) {
      const pred = doc.data()
      const points = calculatePoints(
        { localGoals: pred['localGoalPrediction'] ?? 0, visitorGoals: pred['visitorGoalPrediction'] ?? 0 },
        { localGoals, visitorGoals }
      )
      batch1.update(doc.ref, { points })
      affectedBoardIds.add(pred['boardId'] as string)
    }
    await batch1.commit()

    // 3. Actualizar stats de cada board
    for (const boardId of affectedBoardIds) {
      const allPreds = await db()
        .collection('predictions')
        .where('boardId', '==', boardId)
        .get()

      let totalPoints = 0
      let predsThreePoints = 0
      let predsOnePoints = 0

      for (const p of allPreds.docs) {
        const pts = p.data()['points'] as number ?? 0
        totalPoints += pts
        if (pts === 3) predsThreePoints++
        if (pts === 1) predsOnePoints++
      }

      await db().collection('boards').doc(boardId).update({
        totalPoints,
        predsThreePoints,
        predsOnePoints
      })
    }

    // 4. Recalcular posiciones por grupo
    const boardsSnap = await db()
      .collection('boards')
      .where(admin.firestore.FieldPath.documentId(), 'in', [...affectedBoardIds])
      .get()

    const groupIds = new Set<string>()
    for (const doc of boardsSnap.docs) {
      groupIds.add(doc.data()['groupId'] as string)
    }

    for (const groupId of groupIds) {
      const groupBoardsSnap = await db()
        .collection('boards')
        .where('groupId', '==', groupId)
        .where('isActive', '==', true)
        .get()

      const boards = groupBoardsSnap.docs.map(d => ({
        id: d.id,
        totalPoints: d.data()['totalPoints'] as number ?? 0,
        currentPos: d.data()['currentPos'] as number ?? 0,
        previousPos: d.data()['previousPos'] as number ?? 0
      }))

      const entries = recalculate(boards)
      const updates = toBoardUpdates(entries)

      // Actualizar posiciones en Firestore
      const batch2 = db().batch()
      for (const upd of updates) {
        batch2.update(db().collection('boards').doc(upd.boardId), {
          currentPos: upd.currentPos,
          previousPos: upd.previousPos
        })
      }
      await batch2.commit()

      // Escribir ranking en Realtime DB
      const rankingData = entries.reduce<Record<string, object>>((acc, e) => {
        acc[e.boardId] = {
          position: e.position,
          previousPosition: e.previousPosition,
          totalPoints: e.totalPoints,
          positionDelta: e.positionDelta
        }
        return acc
      }, {})

      await rtdb().ref(`rankings/${groupId}`).set(rankingData)
    }
  }
)
