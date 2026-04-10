/**
 * RankingService — Lógica de clasificación
 * PURA: sin Vue, sin Firebase. Recibe boards con puntos y devuelve el ranking ordenado.
 */
import type { Board, RankingEntry } from '~/types'

export class RankingService {
  /** Calcula el delta de posición entre la actual y la anterior */
  getPositionDelta(currentPos: number, previousPos: number): 'up' | 'down' | 'same' {
    if (previousPos === 0) return 'same' // primera vez, sin historial
    if (currentPos < previousPos) return 'up'
    if (currentPos > previousPos) return 'down'
    return 'same'
  }

  /**
   * Recalcula las posiciones de los boards de un grupo.
   * Devuelve los boards ordenados con currentPos y previousPos actualizados.
   */
  recalculate(boards: Board[]): RankingEntry[] {
    // Ordenar: más puntos primero; empate → más predicciones exactas; empate → más de 1 punto
    const sorted = [...boards].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      if (b.predsThreePoints !== a.predsThreePoints) return b.predsThreePoints - a.predsThreePoints
      return b.predsOnePoints - a.predsOnePoints
    })

    return sorted.map((board, index) => {
      const newPos = index + 1
      const delta = this.getPositionDelta(newPos, board.currentPos)

      return {
        boardId: board.id,
        boardNumber: board.number,
        userId: board.userId,
        userDisplayName: board.userDisplayName ?? '',
        totalPoints: board.totalPoints,
        predsThreePoints: board.predsThreePoints,
        predsOnePoints: board.predsOnePoints,
        currentPos: newPos,
        previousPos: board.currentPos,
        positionDelta: delta
      }
    })
  }

  /** Genera un array de actualizaciones para el batch update de boards */
  toBoardUpdates(entries: RankingEntry[]) {
    return entries.map(e => ({
      boardId: e.boardId,
      currentPos: e.currentPos,
      previousPos: e.previousPos,
      totalPoints: e.totalPoints,
      predsThreePoints: e.predsThreePoints,
      predsOnePoints: e.predsOnePoints
    }))
  }
}

export const rankingService = new RankingService()
