/**
 * RankingService (Functions) — Recalcula posiciones de un grupo.
 */
export function recalculate(boards) {
  const sorted = [...boards].sort((a, b) => b.totalPoints - a.totalPoints)
  return sorted.map((board, idx) => {
    const newPos = idx + 1
    const prevPos = board.currentPos || newPos
    let positionDelta = 'same'
    if (newPos < prevPos)
      positionDelta = 'up'
    else if (newPos > prevPos)
      positionDelta = 'down'
    return {
      boardId: board.id,
      position: newPos,
      previousPosition: prevPos,
      totalPoints: board.totalPoints,
      positionDelta
    }
  })
}
export function toBoardUpdates(entries) {
  return entries.map(e => ({
    boardId: e.boardId,
    currentPos: e.position,
    previousPos: e.previousPosition
  }))
}
