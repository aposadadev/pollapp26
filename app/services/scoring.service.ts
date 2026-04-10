/**
 * ScoringService — Lógica de puntuación de predicciones
 * PURA: sin Vue, sin Firebase. Solo recibe datos y devuelve puntos.
 *
 * Reglas:
 *   3 puntos → marcador exacto (ej. predijo 2-1 y fue 2-1)
 *   1 punto  → resultado correcto (ganó local / ganó visitante / empate)
 *   0 puntos → falló el resultado
 *
 * Nota: La tanda de penales NO se considera para el marcador.
 */
import type { PredictionPoints } from '~/types'

export interface GoalResult {
  localGoals: number
  visitorGoals: number
}

export type MatchOutcome = 'local' | 'visitor' | 'draw'

export class ScoringService {
  /** Determina el resultado (ganador o empate) de un marcador */
  getOutcome(result: GoalResult): MatchOutcome {
    if (result.localGoals > result.visitorGoals) return 'local'
    if (result.visitorGoals > result.localGoals) return 'visitor'
    return 'draw'
  }

  /** Calcula los puntos de una predicción individual */
  calculatePoints(prediction: GoalResult, actual: GoalResult): PredictionPoints {
    // Marcador exacto → 3 puntos
    if (
      prediction.localGoals === actual.localGoals
      && prediction.visitorGoals === actual.visitorGoals
    ) {
      return 3
    }

    // Resultado correcto (outcome) → 1 punto
    if (this.getOutcome(prediction) === this.getOutcome(actual)) {
      return 1
    }

    return 0
  }

  /** Calcula los puntos para un array de predicciones */
  calculateBulkPoints(
    predictions: Array<{ localGoalPrediction: number, visitorGoalPrediction: number }>,
    actual: GoalResult
  ): PredictionPoints[] {
    return predictions.map(p =>
      this.calculatePoints(
        { localGoals: p.localGoalPrediction, visitorGoals: p.visitorGoalPrediction },
        actual
      )
    )
  }
}

export const scoringService = new ScoringService()
