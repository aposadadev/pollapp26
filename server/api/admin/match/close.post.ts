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
  try {
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

    // 4. Buscar predicciones utilizando caché cuando esté disponible para evitar lecturas excesivas
    const tournamentId = matchData?.tournamentId || 'mundial2026'
    const groupsSnap = await db.collection('groups')
      .where('tournamentId', '==', tournamentId)
      .where('isActive', '==', true)
      .get()

    const groups = groupsSnap.docs.map(d => ({ id: d.id, name: d.data().name }))

    // Consultar la caché de cada grupo en paralelo
    const cacheSnaps = await Promise.all(
      groups.map(g =>
        db.collection('groups').doc(g.id).collection('matches').doc(matchId).get()
      )
    )

    const allPredictionsToUpdate: Array<{
      id: string
      boardId: string
      localGoalPrediction: number | null
      visitorGoalPrediction: number | null
      points: number
    }> = []

    const groupPredictionsMap = new Map<string, typeof allPredictionsToUpdate>()
    const affectedBoardIds = new Set<string>()

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]!
      const cacheSnap = cacheSnaps[i]!

      // Validar si la caché existe y contiene IDs de predicción para todos los elementos
      const hasIds = cacheSnap.exists && (cacheSnap.data()?.predictions || []).every((p: any) => p.id)

      if (cacheSnap.exists && hasIds) {
        // Caso A: Usar la caché
        const cachedPreds = (cacheSnap.data()!.predictions || []) as any[]
        const predsList = cachedPreds.map(p => {
          const localPred = p.localGoalPrediction
          const visitorPred = p.visitorGoalPrediction
          const hasPrediction = localPred !== null
            && localPred !== undefined
            && visitorPred !== null
            && visitorPred !== undefined
          const points = hasPrediction
            ? scoringService.calculatePoints(
                { localGoals: localPred, visitorGoals: visitorPred },
                { localGoals, visitorGoals }
              )
            : 0
          return {
            id: p.id as string,
            boardId: p.boardId as string,
            localGoalPrediction: localPred as number | null,
            visitorGoalPrediction: visitorPred as number | null,
            points
          }
        })

        allPredictionsToUpdate.push(...predsList)
        groupPredictionsMap.set(group.id, predsList)
        for (const p of predsList) {
          affectedBoardIds.add(p.boardId)
        }
      } else {
        // Caso B: No existe caché, consultar las boards del grupo y sus predicciones desde la DB
        const boardsSnap = await db.collection('boards')
          .where('groupId', '==', group.id)
          .where('isActive', '==', true)
          .get()

        if (!boardsSnap.empty) {
          const boardsList = boardsSnap.docs.map(d => ({
            id: d.id,
            number: d.data().number as number ?? 0,
            userId: d.data().userId as string ?? '',
            userDisplayName: d.data().userDisplayName as string ?? '',
            userPhotoURL: d.data().userPhotoURL as string | undefined
          }))

          const boardIds = boardsList.map(b => b.id)

          const predsSnap = await db.collection('predictions')
            .where('matchId', '==', matchId)
            .where('boardId', 'in', boardIds)
            .get()

          const predsList = predsSnap.docs.map(docSnap => {
            const pred = docSnap.data()
            const localPred = pred.localGoalPrediction
            const visitorPred = pred.visitorGoalPrediction
            const hasPrediction = localPred !== null
              && localPred !== undefined
              && visitorPred !== null
              && visitorPred !== undefined
            const points = hasPrediction
              ? scoringService.calculatePoints(
                  { localGoals: localPred, visitorGoals: visitorPred },
                  { localGoals, visitorGoals }
                )
              : 0
            return {
              id: docSnap.id,
              boardId: pred.boardId as string,
              localGoalPrediction: localPred as number | null,
              visitorGoalPrediction: visitorPred as number | null,
              points
            }
          })

          allPredictionsToUpdate.push(...predsList)
          groupPredictionsMap.set(group.id, predsList)
          for (const p of predsList) {
            affectedBoardIds.add(p.boardId)
          }
        }
      }
    }

    if (allPredictionsToUpdate.length === 0) {
      return { success: true, message: 'Partido cerrado. No se encontraron predicciones.' }
    }

    // 5. Calcular y actualizar puntos de las predicciones en chunks
    const CHUNK_SIZE = 400
    for (let i = 0; i < allPredictionsToUpdate.length; i += CHUNK_SIZE) {
      const chunk = allPredictionsToUpdate.slice(i, i + CHUNK_SIZE)
      const batch1 = db.batch()
      for (const pred of chunk) {
        batch1.update(db.collection('predictions').doc(pred.id), { points: pred.points })
      }
      await batch1.commit()
    }

    // 6. Actualizar las estadísticas de cada Board afectado
    const boardIdsArray = [...affectedBoardIds]
    const groupIds = new Set<string>()
    await Promise.all(
      boardIdsArray.map(async (boardId) => {
        const [allPreds, boardSnap] = await Promise.all([
          db.collection('predictions')
            .where('boardId', '==', boardId)
            .where('points', '>', 0)
            .get(),
          db.collection('boards').doc(boardId).get()
        ])

        if (!boardSnap.exists) {
          console.warn(`[close.post.ts] Board ${boardId} not found in Firestore. Skipping stats update for this orphaned board.`)
          return
        }

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

        const groupId = boardData?.groupId as string
        if (groupId) {
          groupIds.add(groupId)
        }

        await db.collection('boards').doc(boardId).update({
          totalPoints,
          predsThreePoints,
          predsOnePoints
        })
      })
    )

    // 7. Recalcular rankings por grupo en Firestore y Realtime DB, y guardar la caché del partido
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
        userPhotoURL: d.data().userPhotoURL as string ?? '',
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

      // Actualizar caché del partido en Firestore para el grupo
      const predsList = groupPredictionsMap.get(groupId) || []
      const groupPredictions = boards.map(b => {
        const pred = predsList.find(p => p.boardId === b.id)
        return {
          id: pred?.id,
          boardId: b.id,
          boardNumber: b.number,
          userId: b.userId,
          userDisplayName: b.userDisplayName ?? '',
          userPhotoURL: b.userPhotoURL,
          localGoalPrediction: pred ? pred.localGoalPrediction : null,
          visitorGoalPrediction: pred ? pred.visitorGoalPrediction : null,
          points: pred ? pred.points : 0
        }
      }).sort((a, b) => {
        if (b.points !== null && a.points === null) return 1
        if (a.points !== null && b.points === null) return -1
        if (a.points !== null && b.points !== null) return b.points - a.points
        const aHas = a.localGoalPrediction !== null
        const bHas = b.localGoalPrediction !== null
        if (aHas && !bHas) return -1
        if (!aHas && bHas) return 1
        return 0
      })

      await db.collection('groups').doc(groupId).collection('matches').doc(matchId).set({
        matchId,
        groupId,
        predictions: groupPredictions,
        isCalculated: true,
        updatedAt: new Date()
      }, { merge: true })
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('[close.post.ts] Error closing match:', error)
    const err = error as { statusCode?: number, message?: string, stack?: string }
    if (err && err.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Error interno del servidor al cerrar el partido.',
      data: {
        message: err.message,
        stack: err.stack
      }
    })
  }
})
