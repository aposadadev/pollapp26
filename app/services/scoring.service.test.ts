import { describe, it, expect, beforeEach } from 'vitest'
import { ScoringService } from './scoring.service'
import type { GoalResult } from './scoring.service'

describe('ScoringService', () => {
  let service: ScoringService

  beforeEach(() => {
    service = new ScoringService()
  })

  // ─── getOutcome ────────────────────────────────────────────────────
  describe('getOutcome', () => {
    it('returns "local" when local scores more goals', () => {
      expect(service.getOutcome({ localGoals: 2, visitorGoals: 1 })).toBe('local')
    })

    it('returns "visitor" when visitor scores more goals', () => {
      expect(service.getOutcome({ localGoals: 0, visitorGoals: 1 })).toBe('visitor')
    })

    it('returns "draw" when goals are equal', () => {
      expect(service.getOutcome({ localGoals: 1, visitorGoals: 1 })).toBe('draw')
    })

    it('returns "draw" when both teams score 0', () => {
      expect(service.getOutcome({ localGoals: 0, visitorGoals: 0 })).toBe('draw')
    })
  })

  // ─── calculatePoints ───────────────────────────────────────────────
  describe('calculatePoints', () => {
    const actual: GoalResult = { localGoals: 2, visitorGoals: 1 }

    it('returns 3 for an exact score prediction', () => {
      expect(service.calculatePoints({ localGoals: 2, visitorGoals: 1 }, actual)).toBe(3)
    })

    it('returns 1 for correct outcome but wrong score (local wins)', () => {
      expect(service.calculatePoints({ localGoals: 3, visitorGoals: 0 }, actual)).toBe(1)
    })

    it('returns 0 for wrong outcome prediction', () => {
      expect(service.calculatePoints({ localGoals: 1, visitorGoals: 2 }, actual)).toBe(0)
    })

    it('returns 0 for a draw prediction when actual is local win', () => {
      expect(service.calculatePoints({ localGoals: 1, visitorGoals: 1 }, actual)).toBe(0)
    })

    it('returns 3 for exact draw prediction', () => {
      const draw: GoalResult = { localGoals: 0, visitorGoals: 0 }
      expect(service.calculatePoints(draw, draw)).toBe(3)
    })

    it('returns 1 for correct draw outcome but wrong score', () => {
      const actual2: GoalResult = { localGoals: 1, visitorGoals: 1 }
      expect(service.calculatePoints({ localGoals: 2, visitorGoals: 2 }, actual2)).toBe(1)
    })

    it('returns 3 for exact visitor win prediction', () => {
      const actual3: GoalResult = { localGoals: 0, visitorGoals: 2 }
      expect(service.calculatePoints({ localGoals: 0, visitorGoals: 2 }, actual3)).toBe(3)
    })

    it('returns 1 for correct visitor outcome but wrong score', () => {
      const actual3: GoalResult = { localGoals: 0, visitorGoals: 2 }
      expect(service.calculatePoints({ localGoals: 1, visitorGoals: 3 }, actual3)).toBe(1)
    })
  })

  // ─── calculateBulkPoints ───────────────────────────────────────────
  describe('calculateBulkPoints', () => {
    const actual: GoalResult = { localGoals: 1, visitorGoals: 0 }

    it('returns correct points array for multiple predictions', () => {
      const predictions = [
        { localGoalPrediction: 1, visitorGoalPrediction: 0 }, // exact → 3
        { localGoalPrediction: 2, visitorGoalPrediction: 0 }, // correct outcome → 1
        { localGoalPrediction: 0, visitorGoalPrediction: 1 } // wrong → 0
      ]
      expect(service.calculateBulkPoints(predictions, actual)).toEqual([3, 1, 0])
    })

    it('returns empty array for empty predictions', () => {
      expect(service.calculateBulkPoints([], actual)).toEqual([])
    })

    it('returns all 3s when every prediction is exact', () => {
      const predictions = [
        { localGoalPrediction: 1, visitorGoalPrediction: 0 },
        { localGoalPrediction: 1, visitorGoalPrediction: 0 }
      ]
      expect(service.calculateBulkPoints(predictions, actual)).toEqual([3, 3])
    })
  })
})
