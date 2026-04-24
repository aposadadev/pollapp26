import { describe, it, expect, beforeEach } from 'vitest'
import { RankingService } from './ranking.service'
import type { Board } from '~/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeBoard(overrides: Partial<Board> & { id: string }): Board {
  return {
    userId: 'user1',
    userDisplayName: 'User',
    groupId: 'g1',
    groupName: 'Grupo A',
    tournamentId: 't1',
    number: 1,
    isActive: true,
    totalPoints: 0,
    predsThreePoints: 0,
    predsOnePoints: 0,
    currentPos: 0,
    previousPos: 0,
    createdAt: new Date('2026-01-01'),
    ...overrides
  }
}

describe('RankingService', () => {
  let service: RankingService

  beforeEach(() => {
    service = new RankingService()
  })

  // ─── getPositionDelta ────────────────────────────────────────────────
  describe('getPositionDelta', () => {
    it('returns "same" when previousPos is 0 (first time, no history)', () => {
      expect(service.getPositionDelta(1, 0)).toBe('same')
    })

    it('returns "up" when current position is better (lower number)', () => {
      expect(service.getPositionDelta(1, 3)).toBe('up')
    })

    it('returns "down" when current position is worse (higher number)', () => {
      expect(service.getPositionDelta(3, 1)).toBe('down')
    })

    it('returns "same" when position did not change', () => {
      expect(service.getPositionDelta(2, 2)).toBe('same')
    })
  })

  // ─── recalculate ─────────────────────────────────────────────────────
  describe('recalculate', () => {
    it('returns empty array for empty input', () => {
      expect(service.recalculate([])).toEqual([])
    })

    it('sorts boards by totalPoints descending', () => {
      const boards = [
        makeBoard({ id: 'b1', userId: 'u1', number: 1, totalPoints: 5, predsThreePoints: 1, predsOnePoints: 2, currentPos: 2, previousPos: 1 }),
        makeBoard({ id: 'b2', userId: 'u2', number: 2, totalPoints: 10, predsThreePoints: 2, predsOnePoints: 4, currentPos: 1, previousPos: 2 })
      ]
      const result = service.recalculate(boards)
      expect(result[0]!.boardId).toBe('b2')
      expect(result[1]!.boardId).toBe('b1')
    })

    it('assigns correct currentPos after sort', () => {
      const boards = [
        makeBoard({ id: 'b1', userId: 'u1', number: 1, totalPoints: 3, predsThreePoints: 1, predsOnePoints: 0, currentPos: 0, previousPos: 0 }),
        makeBoard({ id: 'b2', userId: 'u2', number: 2, totalPoints: 6, predsThreePoints: 2, predsOnePoints: 0, currentPos: 0, previousPos: 0 })
      ]
      const result = service.recalculate(boards)
      expect(result[0]!.currentPos).toBe(1)
      expect(result[1]!.currentPos).toBe(2)
    })

    it('breaks totalPoints tie by predsThreePoints', () => {
      const boards = [
        makeBoard({ id: 'b1', userId: 'u1', number: 1, totalPoints: 4, predsThreePoints: 1, predsOnePoints: 1, currentPos: 0, previousPos: 0 }),
        makeBoard({ id: 'b2', userId: 'u2', number: 2, totalPoints: 4, predsThreePoints: 2, predsOnePoints: -2, currentPos: 0, previousPos: 0 })
      ]
      const result = service.recalculate(boards)
      expect(result[0]!.boardId).toBe('b2')
    })

    it('breaks predsThreePoints tie by predsOnePoints', () => {
      const boards = [
        makeBoard({ id: 'b1', userId: 'u1', number: 1, totalPoints: 4, predsThreePoints: 1, predsOnePoints: 1, currentPos: 0, previousPos: 0 }),
        makeBoard({ id: 'b2', userId: 'u2', number: 2, totalPoints: 4, predsThreePoints: 1, predsOnePoints: 3, currentPos: 0, previousPos: 0 })
      ]
      const result = service.recalculate(boards)
      expect(result[0]!.boardId).toBe('b2')
    })

    it('sets positionDelta correctly for first-time boards (previousPos=0)', () => {
      const boards = [
        makeBoard({ id: 'b1', userId: 'u1', number: 1, totalPoints: 9, predsThreePoints: 3, predsOnePoints: 0, currentPos: 0, previousPos: 0 })
      ]
      const result = service.recalculate(boards)
      expect(result[0]!.positionDelta).toBe('same')
    })

    it('sets positionDelta "up" when board moved to a better rank', () => {
      // b1 was pos 3, now gets pos 1 → up
      const boards = [
        makeBoard({ id: 'b1', userId: 'u1', number: 1, totalPoints: 10, predsThreePoints: 3, predsOnePoints: 1, currentPos: 3, previousPos: 2 }),
        makeBoard({ id: 'b2', userId: 'u2', number: 2, totalPoints: 5, predsThreePoints: 1, predsOnePoints: 2, currentPos: 2, previousPos: 1 }),
        makeBoard({ id: 'b3', userId: 'u3', number: 3, totalPoints: 3, predsThreePoints: 1, predsOnePoints: 0, currentPos: 1, previousPos: 3 })
      ]
      const result = service.recalculate(boards)
      // b1 goes to pos 1, was at pos 3 → up
      expect(result.find(r => r.boardId === 'b1')!.positionDelta).toBe('up')
      // b2 goes to pos 2, was at pos 2 → same (currentPos used as previousPos reference)
      expect(result.find(r => r.boardId === 'b2')!.positionDelta).toBe('same')
      // b3 goes to pos 3, was at pos 1 → down
      expect(result.find(r => r.boardId === 'b3')!.positionDelta).toBe('down')
    })

    it('populates all RankingEntry fields correctly', () => {
      const board = makeBoard({
        id: 'b1',
        userId: 'u1',
        userDisplayName: 'Alice',
        number: 7,
        totalPoints: 9,
        predsThreePoints: 3,
        predsOnePoints: 0,
        currentPos: 1,
        previousPos: 0
      })
      const [entry] = service.recalculate([board])
      expect(entry).toMatchObject({
        boardId: 'b1',
        boardNumber: 7,
        userId: 'u1',
        userDisplayName: 'Alice',
        totalPoints: 9,
        predsThreePoints: 3,
        predsOnePoints: 0,
        currentPos: 1,
        previousPos: 1 // board.currentPos before recalculate becomes previousPos
      })
    })

    it('falls back to empty string for missing userDisplayName', () => {
      const board = makeBoard({ id: 'b1', userId: 'u1', number: 1, totalPoints: 0, predsThreePoints: 0, predsOnePoints: 0, currentPos: 0, previousPos: 0 })
      delete (board as Partial<Board>).userDisplayName
      const [entry] = service.recalculate([board])
      expect(entry!.userDisplayName).toBe('')
    })
  })

  // ─── toBoardUpdates ───────────────────────────────────────────────────
  describe('toBoardUpdates', () => {
    it('maps ranking entries to board update objects', () => {
      const boards = [
        makeBoard({ id: 'b1', userId: 'u1', number: 1, totalPoints: 6, predsThreePoints: 2, predsOnePoints: 0, currentPos: 2, previousPos: 1 })
      ]
      const entries = service.recalculate(boards)
      const updates = service.toBoardUpdates(entries)
      expect(updates).toHaveLength(1)
      expect(updates[0]).toMatchObject({
        boardId: 'b1',
        currentPos: 1,
        previousPos: 2,
        totalPoints: 6,
        predsThreePoints: 2,
        predsOnePoints: 0
      })
    })

    it('returns empty array for empty entries', () => {
      expect(service.toBoardUpdates([])).toEqual([])
    })
  })
})
