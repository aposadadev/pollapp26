import { where, writeBatch, doc, query, getDocs, collection, type Firestore } from 'firebase/firestore'
import { BaseRepository } from './base.repository'
import type { Prediction, PredictionPoints } from '~/types'

function getDb(): Firestore {
  return useNuxtApp().$firestore as Firestore
}

export class PredictionRepository extends BaseRepository<Prediction> {
  constructor() {
    super('predictions')
  }

  async findByBoard(boardId: string): Promise<Prediction[]> {
    return this.findWhere('boardId', '==', boardId)
  }

  async findByBoardAndMatch(boardId: string, matchId: string): Promise<Prediction | null> {
    const results = await this.findAll([
      where('boardId', '==', boardId),
      where('matchId', '==', matchId)
    ])
    return results[0] ?? null
  }

  async findByMatch(matchId: string): Promise<Prediction[]> {
    return this.findWhere('matchId', '==', matchId)
  }

  async findByMatchAndGroup(matchId: string, boardIds: string[]): Promise<Prediction[]> {
    if (!boardIds.length) return []
    // Firestore limita 'in' a 30 elementos; dividir en chunks si hay más
    const chunks: string[][] = []
    for (let i = 0; i < boardIds.length; i += 30) {
      chunks.push(boardIds.slice(i, i + 30))
    }
    const results: Prediction[] = []
    for (const chunk of chunks) {
      const q = query(
        collection(getDb(), 'predictions'),
        where('matchId', '==', matchId),
        where('boardId', 'in', chunk)
      )
      const snap = await getDocs(q)
      snap.docs.forEach(d => results.push(this.mapDoc(d.id, d.data())))
    }
    return results
  }

  async updateGoals(
    predictionId: string,
    localGoalPrediction: number,
    visitorGoalPrediction: number
  ): Promise<void> {
    await this.update(predictionId, { localGoalPrediction, visitorGoalPrediction })
  }

  async updatePoints(predictionId: string, points: PredictionPoints): Promise<void> {
    await this.update(predictionId, { points })
  }

  /** Actualiza puntos de múltiples predicciones en batch */
  async batchUpdatePoints(updates: Array<{ predictionId: string, points: PredictionPoints }>): Promise<void> {
    const db = getDb()
    const batch = writeBatch(db)
    for (const u of updates) {
      const ref = doc(db, 'predictions', u.predictionId)
      batch.update(ref, { points: u.points })
    }
    await batch.commit()
  }

  /** Crea todas las predicciones de un board en batch */
  async batchCreate(
    boardId: string,
    matchIds: string[]
  ): Promise<void> {
    const db = getDb()
    const batch = writeBatch(db)
    for (const matchId of matchIds) {
      const ref = doc(collection(db, 'predictions'))
      batch.set(ref, {
        boardId,
        matchId,
        localGoalPrediction: null,
        visitorGoalPrediction: null,
        points: 0,
        createdAt: new Date()
      })
    }
    await batch.commit()
  }

  protected override mapDoc(id: string, data: Record<string, unknown>): Prediction {
    return {
      id,
      boardId: data['boardId'] as string ?? '',
      matchId: data['matchId'] as string ?? '',
      localGoalPrediction: data['localGoalPrediction'] as number | null ?? null,
      visitorGoalPrediction: data['visitorGoalPrediction'] as number | null ?? null,
      points: (data['points'] as PredictionPoints) ?? 0
    }
  }
}

export const predictionRepository = new PredictionRepository()
