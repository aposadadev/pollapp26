export type QualifierPhase = 'dieciseisavos' | 'octavos' | 'cuartos' | 'semifinales' | 'final' | 'tercer_lugar' | 'campeon'

export interface QualifierConfig {
  deadlines: Record<QualifierPhase, string | null> // ISO format dates
  actualQualifiers: Record<QualifierPhase, string[]> // IDs of qualified teams
}

export interface QualifierPrediction {
  id: string
  boardId: string
  userId: string
  tournamentId: string
  predictions: Record<QualifierPhase, string[]>
  points: Record<QualifierPhase, number>
  totalPoints: number
  totalTeamsGuessed: number
  updatedAt: Date
}
