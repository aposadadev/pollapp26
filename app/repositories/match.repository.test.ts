import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getDocs } from 'firebase/firestore'
import { MatchRepository } from '~/repositories/match.repository'
import type { Match } from '~/types'

// ─── Mock firebase/firestore and useNuxtApp before importing the repository ──
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn((_field: string, _op: string, _value: unknown) => ({ field: _field, op: _op, value: _value })),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn()
}))

vi.stubGlobal('useNuxtApp', () => ({ $firestore: {} }))

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match1',
    tournamentId: 'tour1',
    localTeamId: 'local1',
    visitorTeamId: 'visitor1',
    localGoals: null,
    visitorGoals: null,
    date: new Date(),
    phase: 'Fase de Grupos',
    matchNumber: 1,
    status: 'scheduled',
    isActive: false,
    isClosed: false,
    createdAt: new Date(),
    visible: true,
    ...overrides
  }
}

function mockGetDocs(matches: Match[]) {
  const mockDocs = matches.map(m => ({
    id: m.id,
    data: () => ({
      ...m,
      date: { toDate: () => m.date },
      createdAt: { toDate: () => m.createdAt }
    })
  }))
  vi.mocked(getDocs).mockResolvedValue({ docs: mockDocs } as ReturnType<typeof getDocs> extends Promise<infer R> ? R : never)
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('MatchRepository', () => {
  let repo: MatchRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new MatchRepository()
  })

  describe('findVisibleByTournament (user route)', () => {
    it('returns only matches with visible=true', async () => {
      const matches = [
        makeMatch({ id: 'm1', matchNumber: 1, visible: true }),
        makeMatch({ id: 'm2', matchNumber: 2, visible: false }),
        makeMatch({ id: 'm3', matchNumber: 3, visible: true })
      ]
      mockGetDocs(matches)

      const result = await repo.findVisibleByTournament('tour1')

      expect(result.map(m => m.id)).toEqual(['m1', 'm3'])
    })

    it('returns matches with visible=undefined (legacy fallback treated as visible)', async () => {
      const matches = [
        makeMatch({ id: 'm1', matchNumber: 1, visible: undefined }),
        makeMatch({ id: 'm2', matchNumber: 2, visible: false })
      ]
      mockGetDocs(matches)

      const result = await repo.findVisibleByTournament('tour1')

      expect(result.map(m => m.id)).toEqual(['m1'])
    })

    it('returns empty array when all matches are hidden', async () => {
      mockGetDocs([
        makeMatch({ id: 'm1', matchNumber: 1, visible: false }),
        makeMatch({ id: 'm2', matchNumber: 2, visible: false })
      ])

      const result = await repo.findVisibleByTournament('tour1')

      expect(result).toHaveLength(0)
    })
  })

  describe('findByTournamentAdmin (admin route)', () => {
    it('returns all matches regardless of visibility', async () => {
      const matches = [
        makeMatch({ id: 'm1', matchNumber: 1, visible: true }),
        makeMatch({ id: 'm2', matchNumber: 2, visible: false }),
        makeMatch({ id: 'm3', matchNumber: 3, visible: undefined })
      ]
      mockGetDocs(matches)

      const result = await repo.findByTournamentAdmin('tour1')

      expect(result.map(m => m.id)).toEqual(['m1', 'm2', 'm3'])
    })
  })
})
