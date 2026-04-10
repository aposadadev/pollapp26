/**
 * MatchService — Lógica de gestión de partidos (admin)
 * El cierre de un partido dispara el recálculo de puntos y posiciones.
 */
import { matchRepository } from '~/repositories/match.repository'
import { predictionRepository } from '~/repositories/prediction.repository'
import { boardRepository } from '~/repositories/board.repository'
import { rankingsRepository } from '~/repositories/rankings.repository'
import { scoringService } from './scoring.service'
import { rankingService } from './ranking.service'
import type { Match } from '~/types'

export class MatchService {
  async findByTournament(tournamentId: string): Promise<Match[]> {
    return matchRepository.findByTournament(tournamentId)
  }

  async findActive(tournamentId: string): Promise<Match[]> {
    return matchRepository.findActive(tournamentId)
  }

  async findClosed(tournamentId: string): Promise<Match[]> {
    return matchRepository.findClosed(tournamentId)
  }

  async findById(matchId: string): Promise<Match | null> {
    return matchRepository.findById(matchId)
  }

  async updateTeams(matchId: string, localTeamId: string, visitorTeamId: string): Promise<void> {
    await matchRepository.updateTeams(matchId, localTeamId, visitorTeamId)
  }

  /**
   * Cierra un partido:
   * 1. Actualiza el marcador y marca el partido como cerrado
   * 2. Recalcula puntos de todas las predicciones del partido
   * 3. Actualiza los totales de cada board
   * 4. Recalcula posiciones de todos los grupos afectados
   * 5. Escribe el nuevo ranking en Realtime DB
   */
  async closeMatch(matchId: string, localGoals: number, visitorGoals: number): Promise<void> {
    // 1. Cerrar partido en Firestore
    await matchRepository.closeMatch(matchId, localGoals, visitorGoals)

    // 2. Obtener todas las predicciones del partido
    const predictions = await predictionRepository.findByMatch(matchId)
    if (!predictions.length) return

    // 3. Calcular puntos por predicción
    const pointsUpdates = predictions.map(pred => ({
      predictionId: pred.id,
      points: scoringService.calculatePoints(
        { localGoals: pred.localGoalPrediction ?? 0, visitorGoals: pred.visitorGoalPrediction ?? 0 },
        { localGoals, visitorGoals }
      )
    }))

    await predictionRepository.batchUpdatePoints(pointsUpdates)

    // 4. Actualizar totales de cada board afectado
    const affectedBoardIds = [...new Set(predictions.map(p => p.boardId))]
    for (const boardId of affectedBoardIds) {
      const allBoardPreds = await predictionRepository.findByBoard(boardId)
      const totalPoints = allBoardPreds.reduce((sum, p) => sum + p.points, 0)
      const predsThreePoints = allBoardPreds.filter(p => p.points === 3).length
      const predsOnePoints = allBoardPreds.filter(p => p.points === 1).length
      // Solo actualizamos los stats de puntos — currentPos y previousPos
      // se actualizan en el paso 5 vía batchUpdatePositions para preservar
      // el historial de posición y que el delta (arriba/abajo) funcione.
      await boardRepository.updatePointsStats(boardId, {
        totalPoints,
        predsThreePoints,
        predsOnePoints
      })
    }

    // 5. Recalcular posiciones por grupo
    const affectedBoards = await Promise.all(affectedBoardIds.map(id => boardRepository.findById(id)))
    const groupIds = [...new Set(affectedBoards.filter(Boolean).map(b => b!.groupId))]

    for (const groupId of groupIds) {
      const groupBoards = await boardRepository.findActiveByGroup(groupId)
      const rankingEntries = rankingService.recalculate(groupBoards)
      const updates = rankingService.toBoardUpdates(rankingEntries)
      await boardRepository.batchUpdatePositions(updates)
      await rankingsRepository.write(groupId, rankingEntries)
    }
  }
}

export const matchService = new MatchService()
