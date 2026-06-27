import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PredictionService } from './prediction.service'
import type { PredictionPoints } from '~/types'

// ─── Mock Repositories ────────────────────────────────────────────────────────
const mockPredictionRepo = vi.hoisted(() => ({
  findByBoard: vi.fn(),
  findByBoardAndMatch: vi.fn(),
  findByMatch: vi.fn(),
  findByMatchAndGroup: vi.fn(),
  updateGoals: vi.fn(),
  updatePoints: vi.fn()
}))

const mockMatchRepo = vi.hoisted(() => ({
  findByTournament: vi.fn(),
  findVisibleByTournament: vi.fn(),
  findActive: vi.fn(),
  findClosed: vi.fn(),
  findById: vi.fn(),
  activateMatch: vi.fn(),
  updateTeams: vi.fn(),
  update: vi.fn(),
  closeMatch: vi.fn(),
  findAll: vi.fn()
}))

const mockRankingsRepo = vi.hoisted(() => ({
  readDetail: vi.fn()
}))

const mockBoardRepo = vi.hoisted(() => ({
  findById: vi.fn()
}))

vi.mock('~/repositories/prediction.repository', () => ({ predictionRepository: mockPredictionRepo }))
vi.mock('~/repositories/match.repository', () => ({ matchRepository: mockMatchRepo }))
vi.mock('~/repositories/rankings.repository', () => ({ rankingsRepository: mockRankingsRepo }))
vi.mock('~/repositories/board.repository', () => ({ boardRepository: mockBoardRepo }))

// Stub runtime config
vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    tournamentId: 't1'
  }
}))

describe('PredictionService', () => {
  let service: PredictionService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PredictionService()
  })

  describe('getRankingsDetailWithMatches', () => {
    it('returns empty array if rankings history detail not found or empty', async () => {
      mockRankingsRepo.readDetail.mockResolvedValue(null)
      const result = await service.getRankingsDetailWithMatches('board1')
      expect(result).toEqual([])
      expect(mockRankingsRepo.readDetail).toHaveBeenCalledWith('board1')
    })

    it('returns empty array if history has entries but tournament matches are empty', async () => {
      mockRankingsRepo.readDetail.mockResolvedValue({
        updatedAt: 123456,
        history: [
          { matchId: 'm1', points: 3, localGoalPrediction: 2, visitorGoalPrediction: 1 }
        ]
      })
      mockBoardRepo.findById.mockResolvedValue({ id: 'board1', tournamentId: 't1' })
      mockMatchRepo.findVisibleByTournament.mockResolvedValue([])

      const result = await service.getRankingsDetailWithMatches('board1')
      expect(result).toEqual([])
      expect(mockMatchRepo.findVisibleByTournament).toHaveBeenCalledWith('t1')
    })

    it('cross-references history and matches, returning parsed PredictionWithMatch structures', async () => {
      mockRankingsRepo.readDetail.mockResolvedValue({
        updatedAt: 123456,
        history: [
          { matchId: 'm1', points: 3, localGoalPrediction: 2, visitorGoalPrediction: 1 },
          { matchId: 'm2', points: 1, localGoalPrediction: 0, visitorGoalPrediction: 0 }
        ]
      })
      mockBoardRepo.findById.mockResolvedValue({ id: 'board1', tournamentId: 't1' })

      const dateStr = '2026-06-15T18:00:00.000Z'
      mockMatchRepo.findVisibleByTournament.mockResolvedValue([
        {
          id: 'm1',
          localTeamName: 'Team A',
          visitorTeamName: 'Team B',
          localTeamLogo: 'logoA.png',
          visitorTeamLogo: 'logoB.png',
          localGoals: 2,
          visitorGoals: 1,
          date: new Date(dateStr),
          phase: 'Fase de Grupos',
          matchNumber: 1,
          status: 'closed',
          isClosed: true,
          isActive: false
        },
        {
          id: 'm2',
          localTeamName: 'Team C',
          visitorTeamName: 'Team D',
          localTeamLogo: 'logoC.png',
          visitorTeamLogo: 'logoD.png',
          localGoals: 1,
          visitorGoals: 1,
          date: new Date(dateStr),
          phase: 'Fase de Grupos',
          matchNumber: 2,
          status: 'closed',
          isClosed: true,
          isActive: false
        }
      ])

      const result = await service.getRankingsDetailWithMatches('board1')
      expect(result).toHaveLength(2)

      expect(result[0]).toEqual({
        id: 'board1_m1',
        boardId: 'board1',
        matchId: 'm1',
        localGoalPrediction: 2,
        visitorGoalPrediction: 1,
        points: 3 as PredictionPoints,
        match: {
          id: 'm1',
          localTeamName: 'Team A',
          visitorTeamName: 'Team B',
          localTeamLogo: 'logoA.png',
          visitorTeamLogo: 'logoB.png',
          localGoals: 2,
          visitorGoals: 1,
          date: new Date(dateStr),
          phase: 'Fase de Grupos',
          matchNumber: 1,
          status: 'closed',
          isClosed: true,
          isActive: false
        }
      })

      expect(result[1]).toEqual({
        id: 'board1_m2',
        boardId: 'board1',
        matchId: 'm2',
        localGoalPrediction: 0,
        visitorGoalPrediction: 0,
        points: 1 as PredictionPoints,
        match: {
          id: 'm2',
          localTeamName: 'Team C',
          visitorTeamName: 'Team D',
          localTeamLogo: 'logoC.png',
          visitorTeamLogo: 'logoD.png',
          localGoals: 1,
          visitorGoals: 1,
          date: new Date(dateStr),
          phase: 'Fase de Grupos',
          matchNumber: 2,
          status: 'closed',
          isClosed: true,
          isActive: false
        }
      })
    })
  })
})
