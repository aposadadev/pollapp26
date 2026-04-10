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
    isClosed: boolean
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
