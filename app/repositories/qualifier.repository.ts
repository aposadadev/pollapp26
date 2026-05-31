import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore'
import { BaseRepository } from './base.repository'
import type { QualifierPrediction, QualifierConfig, QualifierPhase } from '~/types'

function getDb(): Firestore {
  return useNuxtApp().$firestore as Firestore
}

export class QualifierRepository extends BaseRepository<QualifierPrediction> {
  constructor() {
    super('qualifier_predictions')
  }

  async getConfig(): Promise<QualifierConfig> {
    const docRef = doc(getDb(), 'settings', 'qualifiers_config')
    const snap = await getDoc(docRef)
    if (!snap.exists()) {
      // Default empty configuration
      const emptyDeadlines = {
        dieciseisavos: null,
        octavos: null,
        cuartos: null,
        semifinales: null,
        final: null,
        tercer_lugar: null,
        campeon: null
      }
      const emptyActual = {
        dieciseisavos: [],
        octavos: [],
        cuartos: [],
        semifinales: [],
        final: [],
        tercer_lugar: [],
        campeon: []
      }
      return { deadlines: emptyDeadlines, actualQualifiers: emptyActual }
    }
    const data = snap.data()
    return {
      deadlines: (data['deadlines'] as Record<QualifierPhase, string | null>) ?? {},
      actualQualifiers: (data['actualQualifiers'] as Record<QualifierPhase, string[]>) ?? {}
    }
  }

  async saveConfig(config: QualifierConfig): Promise<void> {
    const docRef = doc(getDb(), 'settings', 'qualifiers_config')
    await setDoc(docRef, config, { merge: true })
  }

  async findByBoard(boardId: string): Promise<QualifierPrediction | null> {
    return this.findById(boardId)
  }

  async savePrediction(boardId: string, prediction: Partial<Omit<QualifierPrediction, 'boardId'>>): Promise<void> {
    const docRef = doc(getDb(), 'qualifier_predictions', boardId)
    await setDoc(docRef, {
      ...prediction,
      boardId,
      updatedAt: new Date()
    }, { merge: true })
  }

  protected override mapDoc(id: string, data: Record<string, unknown>): QualifierPrediction {
    return {
      id,
      boardId: id,
      userId: data['userId'] as string ?? '',
      tournamentId: data['tournamentId'] as string ?? '',
      predictions: (data['predictions'] as Record<QualifierPhase, string[]>) ?? {
        dieciseisavos: [],
        octavos: [],
        cuartos: [],
        semifinales: [],
        final: [],
        tercer_lugar: [],
        campeon: []
      },
      points: (data['points'] as Record<QualifierPhase, number>) ?? {
        dieciseisavos: 0,
        octavos: 0,
        cuartos: 0,
        semifinales: 0,
        final: 0,
        tercer_lugar: 0,
        campeon: 0
      },
      totalPoints: data['totalPoints'] as number ?? 0,
      totalTeamsGuessed: data['totalTeamsGuessed'] as number ?? 0,
      updatedAt: (data['updatedAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
    }
  }
}

export const qualifierRepository = new QualifierRepository()
