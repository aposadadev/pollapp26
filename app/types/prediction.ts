export type PredictionPoints = 0 | 1 | 3

export interface Prediction {
  id: string
  boardId: string
  matchId: string
  localGoalPrediction: number | null
  visitorGoalPrediction: number | null
  points: PredictionPoints
}

export interface PredictionWithMatch extends Prediction {
  match: {
    id: string
    localTeamName: string
    visitorTeamName: string
    localTeamLogo: string
    visitorTeamLogo: string
    localGoals: number | null
    visitorGoals: number | null
    date: Date
    phase: string
    matchNumber: number
    stadium?: string
    /** Fuente de verdad del estado del partido. */
    status: import('./match').MatchStatus
    /** @deprecated Usar `status`. Mantenido para compatibilidad con componentes aún no migrados. */
    isClosed: boolean
    /** @deprecated Usar `status`. Mantenido para compatibilidad con componentes aún no migrados. */
    isActive: boolean
  }
}

export interface MatchPredictionEntry {
  boardId: string
  boardNumber: number
  userId: string
  userDisplayName: string
  localGoalPrediction: number | null
  visitorGoalPrediction: number | null
  points: PredictionPoints
}
