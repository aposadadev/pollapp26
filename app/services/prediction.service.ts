/**
 * PredictionService — Lógica de predicciones
 * Valida que el partido no haya comenzado antes de permitir guardar.
 */
import dayjs from 'dayjs'
import { predictionRepository } from '~/repositories/prediction.repository'
import { matchRepository } from '~/repositories/match.repository'
import type { PredictionWithMatch } from '~/types'

export class PredictionError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'PredictionError'
  }
}

export class PredictionService {
  /** Guarda una predicción. Lanza error si el partido ya comenzó. */
  async savePrediction(
    predictionId: string,
    localGoalPrediction: number,
    visitorGoalPrediction: number
  ): Promise<void> {
    const prediction = await predictionRepository.findById(predictionId)
    if (!prediction) throw new PredictionError('Predicción no encontrada.', 'prediction/not-found')

    // Buscar el partido en paralelo ya que ya tenemos el matchId
    const match = await matchRepository.findById(prediction.matchId)
    if (!match) throw new PredictionError('Partido no encontrado.', 'prediction/match-not-found')

    if (match.isClosed) {
      throw new PredictionError('Este partido ya terminó. No puedes modificar tu predicción.', 'prediction/match-closed')
    }

    // Bloquear cuando el partido ya empezó (con 5 min de margen)
    const matchStart = dayjs(match.date)
    const now = dayjs()
    if (now.isAfter(matchStart.subtract(5, 'minute'))) {
      throw new PredictionError(
        'El partido ya comenzó. No puedes modificar tu predicción.',
        'prediction/match-started'
      )
    }

    await predictionRepository.updateGoals(predictionId, localGoalPrediction, visitorGoalPrediction)
  }

  /** Obtiene predicciones de un board con info del partido embebida.
   *
   * Optimización: en vez de hacer 1 query por partido (N+1),
   * trae todas las predicciones y todos los partidos del torneo en paralelo
   * y los une en memoria. 2 roundtrips en total en lugar de N+1.
   */
  async getPredictionsWithMatches(boardId: string): Promise<PredictionWithMatch[]> {
    // Obtener el board para saber el tournamentId
    const board = await (await import('~/repositories/board.repository')).boardRepository.findById(boardId)
    const tournamentId = board?.tournamentId ?? 'mundial2026'

    // 2 queries en paralelo en lugar de N+1 secuenciales
    const [predictions, matches] = await Promise.all([
      predictionRepository.findByBoard(boardId),
      matchRepository.findByTournament(tournamentId)
    ])

    // Índice de partidos para O(1) lookup
    const matchMap = new Map(matches.map(m => [m.id, m]))

    return predictions.reduce<PredictionWithMatch[]>((acc, pred) => {
      const match = matchMap.get(pred.matchId)
      if (!match) return acc

      acc.push({
        ...pred,
        match: {
          id: match.id,
          localTeamName: match.localTeamName ?? '',
          visitorTeamName: match.visitorTeamName ?? '',
          localTeamLogo: match.localTeamLogo ?? '',
          visitorTeamLogo: match.visitorTeamLogo ?? '',
          localGoals: match.localGoals,
          visitorGoals: match.visitorGoals,
          date: match.date,
          phase: match.phase,
          matchNumber: match.matchNumber,
          isClosed: match.isClosed,
          isActive: match.isActive
        }
      })
      return acc
    }, [])
  }

  getUpcoming(predictions: PredictionWithMatch[]): PredictionWithMatch[] {
    return predictions
      .filter(p => !p.match.isClosed)
      .sort((a, b) => a.match.date.getTime() - b.match.date.getTime())
  }

  getPrevious(predictions: PredictionWithMatch[]): PredictionWithMatch[] {
    return predictions
      .filter(p => p.match.isClosed)
      .sort((a, b) => b.match.date.getTime() - a.match.date.getTime())
  }

  /** Genera un marcador aleatorio (0–5 para cada equipo) */
  generateRandom(): { local: number, visitor: number } {
    return {
      local: Math.floor(Math.random() * 6),
      visitor: Math.floor(Math.random() * 6)
    }
  }
}

export const predictionService = new PredictionService()
