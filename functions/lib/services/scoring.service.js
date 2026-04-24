/**
 * ScoringService (Functions) — Copia pura del cliente.
 * Duplicada aquí para no depender del código del frontend.
 * Regla: 3 pts marcador exacto / 1 pt resultado correcto / 0 pts incorrecto.
 */
function getResult(score) {
  if (score.localGoals > score.visitorGoals)
    return 'local'
  if (score.localGoals < score.visitorGoals)
    return 'visitor'
  return 'draw'
}
export function calculatePoints(prediction, actual) {
  if (prediction.localGoals === actual.localGoals && prediction.visitorGoals === actual.visitorGoals) {
    return 3
  }
  if (getResult(prediction) === getResult(actual)) {
    return 1
  }
  return 0
}
