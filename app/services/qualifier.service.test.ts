import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QualifierService } from './qualifier.service'
import type { QualifierPhase } from '~/types'

// ─── Mock repositories & services ────────────────────────────────────────────
const mockQualifierRepo = vi.hoisted(() => ({
  getConfig: vi.fn(),
  findByBoard: vi.fn(),
  savePrediction: vi.fn(),
  findAll: vi.fn()
}))

const mockBoardRepo = vi.hoisted(() => ({
  findById: vi.fn(),
  update: vi.fn(),
  findActiveByGroup: vi.fn(),
  batchUpdatePositions: vi.fn()
}))

const mockPredictionRepo = vi.hoisted(() => ({
  findByBoard: vi.fn()
}))

const mockTeamRepo = vi.hoisted(() => ({
  findAll: vi.fn()
}))

const mockRankingsRepo = vi.hoisted(() => ({
  write: vi.fn()
}))

const mockRankingService = vi.hoisted(() => ({
  recalculate: vi.fn(),
  toBoardUpdates: vi.fn()
}))

vi.mock('~/repositories/qualifier.repository', () => ({ qualifierRepository: mockQualifierRepo }))
vi.mock('~/repositories/board.repository', () => ({ boardRepository: mockBoardRepo }))
vi.mock('~/repositories/prediction.repository', () => ({ predictionRepository: mockPredictionRepo }))
vi.mock('~/repositories/team.repository', () => ({ teamRepository: mockTeamRepo }))
vi.mock('~/repositories/rankings.repository', () => ({ rankingsRepository: mockRankingsRepo }))
vi.mock('~/services/ranking.service', () => ({ rankingService: mockRankingService }))

describe('QualifierService', () => {
  let service: QualifierService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new QualifierService()
  })

  describe('calculateQualifierPoints', () => {
    it('returns zero points when there are no predictions or actual data', () => {
      const predictions: Record<QualifierPhase, string[]> = {
        dieciseisavos: [],
        octavos: [],
        cuartos: [],
        semifinales: [],
        final: [],
        tercer_lugar: [],
        campeon: []
      }
      const actual: Record<QualifierPhase, string[]> = {
        dieciseisavos: [],
        octavos: [],
        cuartos: [],
        semifinales: [],
        final: [],
        tercer_lugar: [],
        campeon: []
      }

      const result = service.calculateQualifierPoints(predictions, actual)
      expect(result.totalPoints).toBe(0)
      expect(result.totalTeamsGuessed).toBe(0)
      expect(result.points.dieciseisavos).toBe(0)
    })

    it('correctly calculates points for partially matching predictions', () => {
      const predictions: Record<QualifierPhase, string[]> = {
        dieciseisavos: ['t1', 't2', 't3'],
        octavos: ['t4', 't5'],
        cuartos: ['t6'],
        semifinales: [],
        final: [],
        tercer_lugar: [],
        campeon: []
      }
      const actual: Record<QualifierPhase, string[]> = {
        dieciseisavos: ['t1', 't3', 't9'], // matches t1, t3 (2 points)
        octavos: ['t4', 't8'], // matches t4 (1 point)
        cuartos: ['t7'], // matches none (0 points)
        semifinales: [],
        final: [],
        tercer_lugar: [],
        campeon: []
      }

      const result = service.calculateQualifierPoints(predictions, actual)
      expect(result.points.dieciseisavos).toBe(2)
      expect(result.points.octavos).toBe(1)
      expect(result.points.cuartos).toBe(0)
      expect(result.totalPoints).toBe(3)
      expect(result.totalTeamsGuessed).toBe(3)
    })
  })

  describe('savePhasePrediction', () => {
    beforeEach(() => {
      mockQualifierRepo.getConfig.mockResolvedValue({
        deadlines: {
          dieciseisavos: null,
          octavos: '2026-06-30T12:00:00Z',
          cuartos: null,
          semifinales: null,
          final: null,
          tercer_lugar: null,
          campeon: null
        },
        actualQualifiers: {
          dieciseisavos: [],
          octavos: [],
          cuartos: [],
          semifinales: [],
          final: [],
          tercer_lugar: [],
          campeon: []
        }
      })

      mockQualifierRepo.findByBoard.mockResolvedValue(null)
      mockBoardRepo.findById.mockResolvedValue({
        id: 'board1',
        userId: 'user1',
        groupId: 'group1',
        totalPoints: 0,
        qualifierPoints: 0,
        totalTeamsGuessed: 0
      })
      mockPredictionRepo.findByBoard.mockResolvedValue([])
      mockBoardRepo.findActiveByGroup.mockResolvedValue([])
      mockRankingService.recalculate.mockReturnValue([])
      mockRankingService.toBoardUpdates.mockReturnValue([])
    })

    it('throws an error if deadline has passed', async () => {
      const pastDeadline = new Date(Date.now() - 10000).toISOString()
      mockQualifierRepo.getConfig.mockResolvedValue({
        deadlines: {
          dieciseisavos: null,
          octavos: pastDeadline,
          cuartos: null,
          semifinales: null,
          final: null,
          tercer_lugar: null,
          campeon: null
        },
        actualQualifiers: {
          dieciseisavos: [],
          octavos: [],
          cuartos: [],
          semifinales: [],
          final: [],
          tercer_lugar: [],
          campeon: []
        }
      })

      await expect(
        service.savePhasePrediction('board1', 'user1', 't1', 'octavos', ['teamA'])
      ).rejects.toThrow('El tiempo límite para realizar pronósticos en esta fase ha expirado.')
    })

    it('saves prediction and recalculates standings on success', async () => {
      const futureDeadline = new Date(Date.now() + 100000).toISOString()
      mockQualifierRepo.getConfig.mockResolvedValue({
        deadlines: {
          dieciseisavos: null,
          octavos: futureDeadline,
          cuartos: null,
          semifinales: null,
          final: null,
          tercer_lugar: null,
          campeon: null
        },
        actualQualifiers: {
          dieciseisavos: [],
          octavos: ['teamA'],
          cuartos: [],
          semifinales: [],
          final: [],
          tercer_lugar: [],
          campeon: []
        }
      })

      mockBoardRepo.findActiveByGroup.mockResolvedValue([
        {
          id: 'board1',
          userId: 'user1',
          groupId: 'group1',
          totalPoints: 0,
          qualifierPoints: 0,
          totalTeamsGuessed: 0
        }
      ])

      const rankingEntries = [
        {
          boardId: 'board1',
          totalPoints: 1,
          totalTeamsGuessed: 1,
          currentPos: 1,
          previousPos: 1
        }
      ]
      mockRankingService.recalculate.mockReturnValue(rankingEntries)
      mockRankingService.toBoardUpdates.mockReturnValue([
        {
          boardId: 'board1',
          currentPos: 1,
          previousPos: 1,
          totalPoints: 1,
          totalTeamsGuessed: 1
        }
      ])

      await service.savePhasePrediction('board1', 'user1', 't1', 'octavos', ['teamA'])

      expect(mockQualifierRepo.savePrediction).toHaveBeenCalled()
      expect(mockBoardRepo.update).toHaveBeenCalledWith('board1', {
        qualifierPoints: 1,
        totalTeamsGuessed: 1,
        totalPoints: 1
      })
      expect(mockBoardRepo.batchUpdatePositions).toHaveBeenCalled()
      expect(mockRankingsRepo.write).toHaveBeenCalledWith('group1', rankingEntries)
    })
  })
})
