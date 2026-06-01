export interface Board {
  id: string
  userId: string
  userDisplayName?: string
  userPhotoURL?: string
  groupId: string
  groupName?: string
  tournamentId: string
  number: number
  isActive: boolean
  totalPoints: number
  predsThreePoints: number
  predsOnePoints: number
  currentPos: number
  previousPos: number
  qualifierPoints?: number
  totalTeamsGuessed?: number
  createdAt: Date
}

export interface BoardStats {
  totalPoints: number
  predsThreePoints: number
  predsOnePoints: number
  currentPos: number
  previousPos: number
  positionDelta: 'up' | 'down' | 'same'
}
