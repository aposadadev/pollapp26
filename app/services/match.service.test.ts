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

vi.mock('~/repositories/match.repository', () => ({ matchRepository: mockMatchRepo }))
vi.mock('~/repositories/team.repository', () => ({ teamRepository: mockTeamRepo }))

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

// Stub useNuxtApp and $fetch for closeMatch tests
const mockGetIdToken = vi.fn().mockResolvedValue('mock-token')
const mockFirebaseAuth = {
  currentUser: {
    getIdToken: mockGetIdToken
  }
}
vi.stubGlobal('useNuxtApp', () => ({
  $firebaseAuth: mockFirebaseAuth
}))
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('MatchService.closeMatch', () => {
  let service: MatchService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MatchService()
  })

  it('calls the server API endpoint with goals, overtime goals, and penalties', async () => {
    mockFetch.mockResolvedValue({ success: true })

    await service.closeMatch('match1', 1, 1, 2, 2, 4, 3)

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/match/close', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock-token' },
      body: {
        matchId: 'match1',
        localGoals: 1,
        visitorGoals: 1,
        localGoalsOT: 2,
        visitorGoalsOT: 2,
        localPenalties: 4,
        visitorPenalties: 3
      }
    })
  })
})
