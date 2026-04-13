/**
 * useMatches — Composable de partidos
 */
import { matchService } from '~/services/match.service'
import { predictionRepository } from '~/repositories/prediction.repository'
import { boardRepository } from '~/repositories/board.repository'
import type { Match, MatchPredictionEntry } from '~/types'

export function useMatches(tournamentId: string) {
  const matches = ref<Match[]>([])
  const loading = ref(false)

  async function loadAll(): Promise<void> {
    loading.value = true
    try {
      matches.value = await matchService.findByTournament(tournamentId)
    } finally {
      loading.value = false
    }
  }

  async function loadActive(): Promise<void> {
    loading.value = true
    try {
      matches.value = await matchService.findActive()
    } finally {
      loading.value = false
    }
  }

  /** Obtiene las predicciones de todos los participantes de un grupo para un partido */
  async function getMatchPredictions(matchId: string, groupId: string): Promise<MatchPredictionEntry[]> {
    const boards = await boardRepository.findActiveByGroup(groupId)
    const boardIds = boards.map(b => b.id)
    const predictions = await predictionRepository.findByMatchAndGroup(matchId, boardIds)

    return predictions.map((pred) => {
      const board = boards.find(b => b.id === pred.boardId)
      return {
        boardId: pred.boardId,
        boardNumber: board?.number ?? 0,
        userId: board?.userId ?? '',
        userDisplayName: board?.userDisplayName ?? '',
        localGoalPrediction: pred.localGoalPrediction,
        visitorGoalPrediction: pred.visitorGoalPrediction,
        points: pred.points
      }
    }).sort((a, b) => b.points - a.points)
  }

  return {
    matches: readonly(matches),
    loading: readonly(loading),
    loadAll,
    loadActive,
    getMatchPredictions
  }
}
