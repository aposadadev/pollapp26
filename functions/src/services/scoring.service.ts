/**
 * ScoringService (Functions) — Copia pura del cliente.
 * Duplicada aquí para no depender del código del frontend.
 * Regla: 3 pts marcador exacto / 1 pt resultado correcto / 0 pts incorrecto.
 */

export interface Score {
  localGoals: number
  visitorGoals: number
}

function getResult(score: Score): 'local' | 'draw' | 'visitor' {
  if (score.localGoals > score.visitorGoals) return 'local'
  if (score.localGoals < score.visitorGoals) return 'visitor'
  return 'draw'
}

export function calculatePoints(prediction: Score, actual: Score): number {
  if (prediction.localGoals === actual.localGoals && prediction.visitorGoals === actual.visitorGoals) {
    return 3
  }
  if (getResult(prediction) === getResult(actual)) {
    return 1
  }
  return 0
}
