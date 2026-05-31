import { FieldPath } from 'firebase-admin/firestore'
import { scoringService } from '~~/app/services/scoring.service'
import { rankingService } from '~~/app/services/ranking.service'
import type { Board } from '~~/app/types'

interface CloseMatchBody {
  matchId: string
  localGoals: number
  visitorGoals: number
  localGoalsOT?: number | null
  visitorGoalsOT?: number | null
  localPenalties?: number | null
  visitorPenalties?: number | null
}

export default defineEventHandler(async (event) => {
  // 1. Validar que el usuario es administrador
  await requireAdmin(event)

  const body = await readBody<CloseMatchBody>(event)
  const {
    matchId,
    localGoals,
    visitorGoals,
    localGoalsOT = null,
    visitorGoalsOT = null,
    localPenalties = null,
    visitorPenalties = null
  } = body ?? {}

  if (!matchId || localGoals === undefined || visitorGoals === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'matchId, localGoals y visitorGoals son requeridos.'
    })
  }

  const db = getAdminDb()
  const rtdb = getAdminRtdb()

  // 2. Obtener el partido y verificar si ya está cerrado (idempotencia)
  const matchRef = db.collection('matches').doc(matchId)
  const matchSnap = await matchRef.get()
  if (!matchSnap.exists) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Partido no encontrado.'
    })
  }

  const matchData = matchSnap.data()
  if (matchData?.isClosed) {
    return { success: true, message: 'El partido ya estaba cerrado.' }
  }

  // 3. Actualizar el partido a cerrado
  await matchRef.update({
    localGoals,
    visitorGoals,
    localGoalsOT,
    visitorGoalsOT,
    localPenalties,
    visitorPenalties,
    isClosed: true,
    isActive: false,
    status: 'closed'
  })

  // 4. Buscar predicciones del partido
  const predsSnap = await db
    .collection('predictions')
    .where('matchId', '==', matchId)
    .get()

  if (predsSnap.empty) {
    return { success: true, message: 'Partido cerrado. No se encontraron predicciones.' }
  }

  // 5. Calcular y actualizar puntos de las predicciones
  const batch1 = db.batch()
  const affectedBoardIds = new Set<string>()

  for (const docSnap of predsSnap.docs) {
    const pred = docSnap.data()
    const points = scoringService.calculatePoints(
      { localGoals: pred.localGoalPrediction ?? 0, visitorGoals: pred.visitorGoalPrediction ?? 0 },
      { localGoals, visitorGoals }
    )
    batch1.update(docSnap.ref, { points })
    affectedBoardIds.add(pred.boardId as string)
  }
  await batch1.commit()

  // 6. Actualizar las estadísticas de cada Board afectado
  const boardIdsArray = [...affectedBoardIds]
  await Promise.all(
    boardIdsArray.map(async (boardId) => {
      const [allPreds, boardSnap] = await Promise.all([
        db.collection('predictions').where('boardId', '==', boardId).get(),
        db.collection('boards').doc(boardId).get()
      ])

      let matchPoints = 0
      let predsThreePoints = 0
      let predsOnePoints = 0

      for (const p of allPreds.docs) {
        const pts = p.data().points as number ?? 0
        matchPoints += pts
        if (pts === 3) predsThreePoints++
        if (pts === 1) predsOnePoints++
      }

      const boardData = boardSnap.data()
      const qualifierPoints = boardData?.qualifierPoints as number ?? 0
      const totalPoints = matchPoints + qualifierPoints

      await db.collection('boards').doc(boardId).update({
        totalPoints,
        predsThreePoints,
        predsOnePoints
      })
    })
  )

  // 7. Recalcular rankings por grupo en Firestore y Realtime DB
  const boardsSnap = await db
    .collection('boards')
    .where(FieldPath.documentId(), 'in', boardIdsArray)
    .get()

  const groupIds = new Set<string>()
  for (const docSnap of boardsSnap.docs) {
    groupIds.add(docSnap.data().groupId as string)
  }

  for (const groupId of groupIds) {
    const groupBoardsSnap = await db
      .collection('boards')
      .where('groupId', '==', groupId)
      .where('isActive', '==', true)
      .get()

    const boards = groupBoardsSnap.docs.map(d => ({
      id: d.id,
      number: d.data().number as number ?? 0,
      userId: d.data().userId as string ?? '',
      userDisplayName: d.data().userDisplayName as string ?? '',
      totalPoints: d.data().totalPoints as number ?? 0,
      predsThreePoints: d.data().predsThreePoints as number ?? 0,
      predsOnePoints: d.data().predsOnePoints as number ?? 0,
      totalTeamsGuessed: d.data().totalTeamsGuessed as number ?? 0,
      currentPos: d.data().currentPos as number ?? 0,
      previousPos: d.data().previousPos as number ?? 0,
      tournamentId: d.data().tournamentId as string ?? '',
      groupId: d.data().groupId as string ?? '',
      isActive: d.data().isActive as boolean ?? true,
      qualifierPoints: d.data().qualifierPoints as number ?? 0,
      createdAt: d.data().createdAt?.toDate() ?? new Date()
    })) as Board[]

    const entries = rankingService.recalculate(boards)
    const updates = rankingService.toBoardUpdates(entries)

    // Actualizar posiciones de tablas en batch
    const batch2 = db.batch()
    for (const upd of updates) {
      batch2.update(db.collection('boards').doc(upd.boardId), {
        currentPos: upd.currentPos,
        previousPos: upd.previousPos,
        totalPoints: upd.totalPoints,
        predsThreePoints: upd.predsThreePoints,
        predsOnePoints: upd.predsOnePoints,
        totalTeamsGuessed: upd.totalTeamsGuessed
      })
    }
    await batch2.commit()

    // Escribir ranking final en Realtime DB para consumo en tiempo real
    await rtdb.ref(`rankings/${groupId}`).set({
      updatedAt: Date.now(),
      entries
    })
  }

  return { success: true }
})
