import { scoringService } from '~~/app/services/scoring.service'
import { rankingService } from '~~/app/services/ranking.service'
import type { Board } from '~~/app/types'
import type { MatchPredictionEntry } from '~~/app/types/prediction'

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
      const hasIds = cacheSnap.exists && (cacheSnap.data()?.predictions || []).every((p: MatchPredictionEntry) => p.id)

      if (cacheSnap.exists && hasIds) {
        // Caso A: Usar la caché
        const cachedPreds = (cacheSnap.data()!.predictions || []) as MatchPredictionEntry[]
        const predsList = cachedPreds.map((p) => {
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

          const predsList = predsSnap.docs.map((docSnap) => {
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

    // 6. Recalcular estadísticas, rankings por grupo y actualizar caché de partidos
    for (const group of groups) {
      const groupBoardsSnap = await db
        .collection('boards')
        .where('groupId', '==', group.id)
        .where('isActive', '==', true)
        .get()

      if (groupBoardsSnap.empty) continue

      const boardsList = groupBoardsSnap.docs.map(doc => ({
        id: doc.id,
        number: doc.data().number as number ?? 0,
        userId: doc.data().userId as string ?? '',
        userDisplayName: doc.data().userDisplayName as string ?? '',
        userPhotoURL: doc.data().userPhotoURL as string ?? '',
        totalPoints: doc.data().totalPoints as number ?? 0,
        predsThreePoints: doc.data().predsThreePoints as number ?? 0,
        predsOnePoints: doc.data().predsOnePoints as number ?? 0,
        totalTeamsGuessed: doc.data().totalTeamsGuessed as number ?? 0,
        currentPos: doc.data().currentPos as number ?? 0,
        previousPos: doc.data().previousPos as number ?? 0,
        tournamentId: doc.data().tournamentId as string ?? '',
        groupId: doc.data().groupId as string ?? '',
        isActive: doc.data().isActive as boolean ?? true,
        qualifierPoints: doc.data().qualifierPoints as number ?? 0,
        createdAt: doc.data().createdAt?.toDate() ?? new Date()
      })) as Board[]

      const boardIds = boardsList.map(b => b.id)

      // Consultar todas las predicciones puntuadas de los boards en chunks de 30
      const CHUNK_LIMIT = 30
      const predictionsPromises: Promise<FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>>[] = []
      for (let c = 0; c < boardIds.length; c += CHUNK_LIMIT) {
        const chunkIds = boardIds.slice(c, c + CHUNK_LIMIT)
        predictionsPromises.push(
          db.collection('predictions')
            .where('boardId', 'in', chunkIds)
            .where('points', '>', 0)
            .get()
        )
      }
      const predictionsSnaps = await Promise.all(predictionsPromises)

      // Agrupar predicciones por boardId
      const predsByBoard = new Map<string, Array<{
        matchId: string
        localGoalPrediction: number | null
        visitorGoalPrediction: number | null
        points: number
      }>>()
      for (const snap of predictionsSnaps) {
        for (const doc of snap.docs) {
          const pData = doc.data()
          const bId = pData.boardId as string
          if (!predsByBoard.has(bId)) {
            predsByBoard.set(bId, [])
          }
          predsByBoard.get(bId)!.push({
            matchId: pData.matchId as string,
            localGoalPrediction: pData.localGoalPrediction as number | null,
            visitorGoalPrediction: pData.visitorGoalPrediction as number | null,
            points: pData.points as number
          })
        }
      }

      // Recalcular estadísticas individuales
      for (const board of boardsList) {
        const boardPreds = predsByBoard.get(board.id) || []
        let matchPoints = 0
        let predsThreePoints = 0
        let predsOnePoints = 0

        for (const p of boardPreds) {
          const pts = p.points
          matchPoints += pts
          if (pts === 3) predsThreePoints++
          if (pts === 1) predsOnePoints++
        }

        board.totalPoints = matchPoints + (board.qualifierPoints || 0)
        board.predsThreePoints = predsThreePoints
        board.predsOnePoints = predsOnePoints
      }

      // Recalcular posiciones del grupo
      const entries = rankingService.recalculate(boardsList)
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

      // Escribir ranking final en Realtime DB
      await rtdb.ref(`rankings/${group.id}`).set({
        updatedAt: Date.now(),
        entries
      })

      // Escribir detalles de aciertos por board en Realtime DB
      const rtdbUpdates: Record<string, unknown> = {}
      for (const board of boardsList) {
        const boardPreds = predsByBoard.get(board.id) || []
        const history = boardPreds.map(p => ({
          matchId: p.matchId,
          localGoalPrediction: p.localGoalPrediction,
          visitorGoalPrediction: p.visitorGoalPrediction,
          points: p.points
        }))
        rtdbUpdates[`rankings_detail/${board.id}`] = {
          updatedAt: Date.now(),
          history
        }
      }
      await rtdb.ref().update(rtdbUpdates)

      // Actualizar caché del partido en Firestore para el grupo
      const predsList = groupPredictionsMap.get(group.id) || []
      const groupPredictions = boardsList.map((b) => {
        const pred = predsList.find(p => p.boardId === b.id)
        const entry: MatchPredictionEntry = {
          boardId: b.id,
          boardNumber: b.number,
          userId: b.userId,
          userDisplayName: b.userDisplayName ?? '',
          localGoalPrediction: pred ? pred.localGoalPrediction : null,
          visitorGoalPrediction: pred ? pred.visitorGoalPrediction : null,
          points: (pred ? pred.points : 0) as 0 | 1 | 3
        }
        if (pred?.id) {
          entry.id = pred.id
        }
        if (b.userPhotoURL) {
          entry.userPhotoURL = b.userPhotoURL
        }
        return entry
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

      await db.collection('groups').doc(group.id).collection('matches').doc(matchId).set({
        matchId,
        groupId: group.id,
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
