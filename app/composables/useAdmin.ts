/**
 * useAdmin — Composable para funciones de administración
 */
import { matchService } from '~/services/match.service'
import { boardService } from '~/services/board.service'
import { teamRepository } from '~/repositories/team.repository'
import type { Board, Team } from '~/types'

export function useAdmin() {
  const toast = useToast()
  const loading = ref(false)

  // ── Partidos ──────────────────────────────────────────────────────────────

  async function closeMatch(
    matchId: string,
    localGoals: number,
    visitorGoals: number
  ): Promise<boolean> {
    loading.value = true
    try {
      await matchService.closeMatch(matchId, localGoals, visitorGoals)
      toast.add({
        title: 'Partido cerrado',
        description: 'Los puntos y posiciones han sido actualizados.',
        color: 'secondary'
      })
      return true
    } catch (err: unknown) {
      toast.add({ title: 'Error al cerrar partido', description: (err as Error).message, color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateMatchTeams(
    matchId: string,
    localTeamId: string,
    visitorTeamId: string
  ): Promise<boolean> {
    loading.value = true
    try {
      await matchService.updateTeams(matchId, localTeamId, visitorTeamId)
      toast.add({ title: 'Equipos actualizados', color: 'secondary' })
      return true
    } catch (err: unknown) {
      toast.add({ title: 'Error', description: (err as Error).message, color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Tablas ────────────────────────────────────────────────────────────────

  async function getPendingBoards(groupId: string): Promise<Board[]> {
    return boardService.findPendingByGroup(groupId)
  }

  async function activateBoard(boardId: string, tournamentId: string): Promise<boolean> {
    loading.value = true
    try {
      await boardService.activateBoard(boardId, tournamentId)
      toast.add({ title: 'Tabla activada', description: 'El jugador ya puede hacer predicciones.', color: 'secondary' })
      return true
    } catch (err: unknown) {
      toast.add({ title: 'Error al activar tabla', description: (err as Error).message, color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Equipos ───────────────────────────────────────────────────────────────

  async function getTeams(): Promise<Team[]> {
    return teamRepository.findAll()
  }

  async function createTeam(
    name: string,
    shortName: string,
    logoUrl: string,
    country: string
  ): Promise<boolean> {
    loading.value = true
    try {
      await teamRepository.create({ name, shortName, logoUrl, country })
      toast.add({ title: 'Equipo creado', color: 'secondary' })
      return true
    } catch (err: unknown) {
      toast.add({ title: 'Error', description: (err as Error).message, color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    closeMatch,
    updateMatchTeams,
    getPendingBoards,
    activateBoard,
    getTeams,
    createTeam
  }
}
