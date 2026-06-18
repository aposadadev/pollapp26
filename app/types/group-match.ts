import type { MatchPredictionEntry } from './prediction'

export interface GroupMatch {
  id: string // matchId
  matchId: string
  groupId: string
  predictions: MatchPredictionEntry[]
  isCalculated: boolean
  updatedAt: Date
}
