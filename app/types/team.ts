export interface Team {
  id: string
  name: string
  shortName: string
  logoUrl: string
  country: string
  createdAt: Date
}

export type TeamOrTbd = Team | { id: 'tbd', name: 'Por definirse', shortName: 'PD', logoUrl: '', country: '' }
