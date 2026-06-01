export interface RankingEntry {
  boardId: string
  boardNumber: number
  userId: string
  userDisplayName: string
  userPhotoURL?: string
  totalPoints: number
  predsThreePoints: number
  predsOnePoints: number
  totalTeamsGuessed?: number
  currentPos: number
  previousPos: number
  positionDelta: 'up' | 'down' | 'same'
}

export interface GroupRanking {
  groupId: string
  updatedAt: number
  entries: RankingEntry[]
}
