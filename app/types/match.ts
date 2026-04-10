export type MatchPhase
  = | 'Fase de Grupos'
    | 'Octavos de Final'
    | 'Cuartos de Final'
    | 'Semifinales'
    | 'Tercer Lugar'
    | 'Final'

export type MatchStatus = 'scheduled' | 'active' | 'closed'

export interface Match {
  id: string
  tournamentId: string
  localTeamId: string
  visitorTeamId: string
  localTeamName?: string
  visitorTeamName?: string
  localTeamLogo?: string
  visitorTeamLogo?: string
  localGoals: number | null
  visitorGoals: number | null
  date: Date
  phase: MatchPhase
  matchNumber: number
  status: MatchStatus
  isActive: boolean
  isClosed: boolean
  createdAt: Date
}

export interface MatchWithTeams extends Match {
  localTeam: { id: string, name: string, shortName: string, logoUrl: string }
  visitorTeam: { id: string, name: string, shortName: string, logoUrl: string }
}
