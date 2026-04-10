export interface Group {
  id: string
  name: string
  code: string
  ownerId: string
  ownerName?: string
  tournamentId: string
  isActive: boolean
  createdAt: Date
}

export interface GroupWithBoardStatus extends Group {
  userBoardId?: string
  userBoardIsActive?: boolean
  userBoardIsPending?: boolean
}
