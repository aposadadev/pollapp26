export interface Board {
  id: string
  userId: string
  userDisplayName?: string
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
