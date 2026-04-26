import { describe, it, expect, vi, beforeEach } from 'vitest'

import { MatchService } from './match.service'

// ─── Mock repositories & services ────────────────────────────────────────────
const mockMatchRepo = vi.hoisted(() => ({
  findByTournament: vi.fn(),
  findVisibleByTournament: vi.fn(),
  findActive: vi.fn(),
  findClosed: vi.fn(),
  findById: vi.fn(),
  activateMatch: vi.fn(),
  updateTeams: vi.fn(),
  update: vi.fn(),
  closeMatch: vi.fn()
}))

const mockTeamRepo = vi.hoisted(() => ({ findById: vi.fn() }))

const mockPredictionRepo = vi.hoisted(() => ({
  findByMatch: vi.fn(),
  batchUpdatePoints: vi.fn(),
  findByBoard: vi.fn()
}))

const mockBoardRepo = vi.hoisted(() => ({
  findById: vi.fn(),
  updatePointsStats: vi.fn(),
  findActiveByGroup: vi.fn(),
  batchUpdatePositions: vi.fn()
}))

const mockRankingsRepo = vi.hoisted(() => ({ write: vi.fn() }))
const mockScoringService = vi.hoisted(() => ({ calculatePoints: vi.fn() }))
const mockRankingService = vi.hoisted(() => ({ recalculate: vi.fn(), toBoardUpdates: vi.fn() }))

vi.mock('~/repositories/match.repository', () => ({ matchRepository: mockMatchRepo }))
vi.mock('~/repositories/team.repository', () => ({ teamRepository: mockTeamRepo }))
vi.mock('~/repositories/prediction.repository', () => ({ predictionRepository: mockPredictionRepo }))
vi.mock('~/repositories/board.repository', () => ({ boardRepository: mockBoardRepo }))
vi.mock('~/repositories/rankings.repository', () => ({ rankingsRepository: mockRankingsRepo }))
vi.mock('./scoring.service', () => ({ scoringService: mockScoringService }))
vi.mock('./ranking.service', () => ({ rankingService: mockRankingService }))

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('MatchService.updateTeams', () => {
  let service: MatchService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MatchService()
    mockTeamRepo.findById.mockResolvedValue({ id: 'team1', name: 'Team A', logoUrl: 'logo-a.png' })
    mockMatchRepo.updateTeams.mockResolvedValue(undefined)
    mockMatchRepo.update.mockResolvedValue(undefined)
  })

  it('calls matchRepository.updateTeams with correct team info', async () => {
    mockTeamRepo.findById
      .mockResolvedValueOnce({ id: 'local1', name: 'Local FC', logoUrl: 'local.png' })
      .mockResolvedValueOnce({ id: 'visitor1', name: 'Visitor FC', logoUrl: 'visitor.png' })

    await service.updateTeams('match1', 'local1', 'visitor1')

    expect(mockMatchRepo.updateTeams).toHaveBeenCalledWith(
      'match1',
      'local1',
      'visitor1',
      'Local FC',
      'local.png',
      'Visitor FC',
      'visitor.png'
    )
  })

  it('publishes the match (visible=true) after defining both teams', async () => {
    mockTeamRepo.findById
      .mockResolvedValueOnce({ id: 'local1', name: 'Local FC', logoUrl: 'local.png' })
      .mockResolvedValueOnce({ id: 'visitor1', name: 'Visitor FC', logoUrl: 'visitor.png' })

    await service.updateTeams('match1', 'local1', 'visitor1')

    expect(mockMatchRepo.update).toHaveBeenCalledWith('match1', { visible: true })
  })

  it('uses empty strings when team is not found in repository', async () => {
    mockTeamRepo.findById.mockResolvedValue(null)

    await service.updateTeams('match1', 'local1', 'visitor1')

    expect(mockMatchRepo.updateTeams).toHaveBeenCalledWith(
      'match1',
      'local1',
      'visitor1',
      '',
      '',
      '',
      ''
    )
  })
})
