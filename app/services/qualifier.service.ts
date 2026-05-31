import { qualifierRepository } from '~/repositories/qualifier.repository'
import { boardRepository } from '~/repositories/board.repository'
import { predictionRepository } from '~/repositories/prediction.repository'
import { teamRepository } from '~/repositories/team.repository'
import { rankingService } from '~/services/ranking.service'
import { rankingsRepository } from '~/repositories/rankings.repository'
import type { QualifierPrediction, QualifierConfig, QualifierPhase } from '~/types'
import { TEAM_GROUPS } from '~/constants/teams'

export class QualifierService {
  /**
   * Obtiene la configuración global de clasificatorios
   */
  async getConfig(): Promise<QualifierConfig> {
    return qualifierRepository.getConfig()
  }

  /**
   * Guarda la configuración global (Admin) y recalcula puntos
   */
  async saveConfig(config: QualifierConfig): Promise<void> {
    await qualifierRepository.saveConfig(config)
    await this.recalculateAllQualifierPoints(config)
  }

  /**
   * Obtiene las predicciones de un board
   */
  async getPredictions(boardId: string): Promise<QualifierPrediction | null> {
    return qualifierRepository.findByBoard(boardId)
  }

  /**
   * Guarda la predicción de una fase específica de un usuario/board,
   * aplicando validaciones de tiempo límite e integridad.
   */
  async savePhasePrediction(
    boardId: string,
    userId: string,
    tournamentId: string,
    phase: QualifierPhase,
    teamIds: string[]
  ): Promise<void> {
    // 1. Validar fecha límite
    const config = await this.getConfig()
    const deadlineStr = config.deadlines[phase]
    if (deadlineStr) {
      const deadline = new Date(deadlineStr)
      if (new Date() > deadline) {
        throw new Error('El tiempo límite para realizar pronósticos en esta fase ha expirado.')
      }
    }

    // 2. Validar límites de cantidad por fase
    const limits: Record<QualifierPhase, number> = {
      dieciseisavos: 32,
      octavos: 16,
      cuartos: 8,
      semifinales: 4,
      final: 2,
      tercer_lugar: 1,
      campeon: 1
    }
    if (teamIds.length > limits[phase]) {
      throw new Error(`No puedes seleccionar más de ${limits[phase]} equipos para esta fase.`)
    }

    // 3. Validar límite de 3 por grupo en dieciseisavos
    if (phase === 'dieciseisavos') {
      const teams = await teamRepository.findAll()
      const teamsMap = new Map(teams.map(t => [t.id, t.name]))

      const groupCounts: Record<string, number> = {}
      for (const id of teamIds) {
        const teamName = teamsMap.get(id)
        if (teamName) {
          const group = TEAM_GROUPS[teamName]
          if (group) {
            groupCounts[group] = (groupCounts[group] || 0) + 1
            if (groupCounts[group] > 3) {
              throw new Error(`No puedes seleccionar más de 3 equipos del Grupo ${group}.`)
            }
          }
        }
      }
    }

    // 4. Obtener predicción existente o inicializar una nueva
    const existing = await this.getPredictions(boardId)
    const predictions = existing
      ? { ...existing.predictions, [phase]: teamIds }
      : {
          dieciseisavos: [],
          octavos: [],
          cuartos: [],
          semifinales: [],
          final: [],
          tercer_lugar: [],
          campeon: [],
          [phase]: teamIds
        }

    // 5. Calcular puntos actuales con la configuración de clasificados oficial
    const scoreResult = this.calculateQualifierPoints(predictions, config.actualQualifiers)

    // 6. Guardar predicción
    await qualifierRepository.savePrediction(boardId, {
      userId,
      tournamentId,
      predictions,
      points: scoreResult.points,
      totalPoints: scoreResult.totalPoints,
      totalTeamsGuessed: scoreResult.totalTeamsGuessed
    })

    // 7. Actualizar el board con los nuevos puntos de clasificados
    const board = await boardRepository.findById(boardId)
    if (board) {
      const matchPreds = await predictionRepository.findByBoard(boardId)
      const matchPoints = matchPreds.reduce((sum, p) => sum + p.points, 0)

      const updatedBoard = {
        ...board,
        qualifierPoints: scoreResult.totalPoints,
        totalTeamsGuessed: scoreResult.totalTeamsGuessed,
        totalPoints: matchPoints + scoreResult.totalPoints
      }

      await boardRepository.update(boardId, {
        qualifierPoints: scoreResult.totalPoints,
        totalTeamsGuessed: scoreResult.totalTeamsGuessed,
        totalPoints: matchPoints + scoreResult.totalPoints
      })

      // Recalcular posiciones y rankings para el grupo de este board (ordena los grupos)
      const groupBoards = await boardRepository.findActiveByGroup(board.groupId)
      const updatedBoards = groupBoards.map(gb => gb.id === boardId ? updatedBoard : gb)
      const rankingEntries = rankingService.recalculate(updatedBoards)
      const updates = rankingService.toBoardUpdates(rankingEntries)
      await boardRepository.batchUpdatePositions(updates)
      await rankingsRepository.write(board.groupId, rankingEntries)
    }
  }

  /**
   * Compara las predicciones de clasificación de un usuario con los clasificados reales
   */
  calculateQualifierPoints(
    predictions: Record<QualifierPhase, string[]>,
    actual: Record<QualifierPhase, string[]>
  ): { points: Record<QualifierPhase, number>, totalPoints: number, totalTeamsGuessed: number } {
    const points: Record<QualifierPhase, number> = {
      dieciseisavos: 0,
      octavos: 0,
      cuartos: 0,
      semifinales: 0,
      final: 0,
      tercer_lugar: 0,
      campeon: 0
    }

    let totalPoints = 0

    const phases: QualifierPhase[] = ['dieciseisavos', 'octavos', 'cuartos', 'semifinales', 'final', 'tercer_lugar', 'campeon']
    for (const phase of phases) {
      const userPreds = predictions[phase] ?? []
      const actualQuals = actual[phase] ?? []

      // La puntuación es la intersección: cantidad de equipos en la lista del usuario que realmente clasificaron
      const correct = userPreds.filter(id => actualQuals.includes(id)).length
      points[phase] = correct
      totalPoints += correct
    }

    return {
      points,
      totalPoints,
      totalTeamsGuessed: totalPoints // 1 punto = 1 equipo adivinado
    }
  }

  /**
   * Recalcula los puntos de clasificatorios de todos los usuarios
   */
  async recalculateAllQualifierPoints(config?: QualifierConfig): Promise<void> {
    const activeConfig = config ?? await this.getConfig()
    const allPredictions = await qualifierRepository.findAll()
    if (!allPredictions.length) return

    // 1. Calcular puntos (puro, sin I/O)
    const predScores = allPredictions.map(pred => ({
      pred,
      scoreResult: this.calculateQualifierPoints(pred.predictions, activeConfig.actualQualifiers)
    }))

    // 2. Leer boards y match predictions en paralelo
    const boardAndPredData = await Promise.all(
      predScores.map(async ({ pred }) => {
        const [board, matchPreds] = await Promise.all([
          boardRepository.findById(pred.boardId),
          predictionRepository.findByBoard(pred.boardId)
        ])
        return { boardId: pred.boardId, board, matchPreds }
      })
    )

    const boardMap = new Map(boardAndPredData.map(d => [d.boardId, d]))
    const affectedGroupIds = new Set<string>()

    // 3. Escribir predicciones y boards en paralelo
    await Promise.all(
      predScores.map(async ({ pred, scoreResult }) => {
        await qualifierRepository.savePrediction(pred.boardId, {
          points: scoreResult.points,
          totalPoints: scoreResult.totalPoints,
          totalTeamsGuessed: scoreResult.totalTeamsGuessed
        })

        const data = boardMap.get(pred.boardId)
        if (data?.board) {
          const matchPoints = data.matchPreds.reduce((sum, p) => sum + p.points, 0)
          await boardRepository.update(pred.boardId, {
            qualifierPoints: scoreResult.totalPoints,
            totalTeamsGuessed: scoreResult.totalTeamsGuessed,
            totalPoints: matchPoints + scoreResult.totalPoints
          })
          affectedGroupIds.add(data.board.groupId)
        }
      })
    )

    // 4. Recalcular posiciones y rankings por grupo (paralelo)
    await Promise.all(
      Array.from(affectedGroupIds).map(async (groupId) => {
        const groupBoards = await boardRepository.findActiveByGroup(groupId)
        const rankingEntries = rankingService.recalculate(groupBoards)
        const updates = rankingService.toBoardUpdates(rankingEntries)
        await boardRepository.batchUpdatePositions(updates)
        await rankingsRepository.write(groupId, rankingEntries)
      })
    )
  }
}

export const qualifierService = new QualifierService()
