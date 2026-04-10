/**
 * RankingService (Functions) — Recalcula posiciones de un grupo.
 */

export interface BoardSnapshot {
  id: string
  totalPoints: number
  currentPos: number
  previousPos: number
}

export interface RankingEntry {
  boardId: string
  userId?: string
  userDisplayName?: string
  position: number
  previousPosition: number
  totalPoints: number
  positionDelta: 'up' | 'down' | 'same'
}

export function recalculate(boards: BoardSnapshot[]): RankingEntry[] {
  const sorted = [...boards].sort((a, b) => b.totalPoints - a.totalPoints)
  return sorted.map((board, idx) => {
    const newPos = idx + 1
    const prevPos = board.currentPos || newPos
    let positionDelta: 'up' | 'down' | 'same' = 'same'
    if (newPos < prevPos) positionDelta = 'up'
    else if (newPos > prevPos) positionDelta = 'down'
    return {
      boardId: board.id,
      position: newPos,
      previousPosition: prevPos,
      totalPoints: board.totalPoints,
      positionDelta
    }
  })
}

export function toBoardUpdates(entries: RankingEntry[]): Array<{ boardId: string, currentPos: number, previousPos: number }> {
  return entries.map(e => ({
    boardId: e.boardId,
    currentPos: e.position,
    previousPos: e.previousPosition
  }))
}
