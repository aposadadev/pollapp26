/**
 * useAdmin — Composable para funciones de administración
 */
import { matchService } from '~/services/match.service'
import { boardService } from '~/services/board.service'
import { groupService } from '~/services/group.service'
import { parseFirebaseError } from '~/utils/firebase-error'
import type { Board, Team, Group } from '~/types'

export function useAdmin() {
  const toast = useToast()
  const loading = ref(false)

  // ── Partidos ──────────────────────────────────────────────────────────────

  async function activateMatch(matchId: string): Promise<boolean> {
    loading.value = true
    try {
      await matchService.activateMatch(matchId)
      toast.add({ title: 'Partido en vivo', description: 'El partido fue marcado como activo.', color: 'secondary' })
      return true
    } catch (err: unknown) {
      toast.add({ title: 'Error al activar partido', description: parseFirebaseError(err), color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

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
      toast.add({ title: 'Error al cerrar partido', description: parseFirebaseError(err), color: 'error' })
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
      toast.add({ title: 'Error', description: parseFirebaseError(err), color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Tablas ────────────────────────────────────────────────────────────────

  async function getPendingBoards(groupId: string): Promise<Board[]> {
    loading.value = true
    try {
      return await boardService.findPendingByGroup(groupId)
    } catch (err: unknown) {
      toast.add({ title: 'Error al cargar tablas pendientes', description: parseFirebaseError(err), color: 'error' })
      return []
    } finally {
      loading.value = false
    }
  }

  async function activateBoard(boardId: string, tournamentId: string): Promise<boolean> {
    loading.value = true
    try {
      await boardService.activateBoard(boardId, tournamentId)
      toast.add({ title: 'Tabla activada', description: 'El jugador ya puede hacer predicciones.', color: 'secondary' })
      return true
    } catch (err: unknown) {
      toast.add({ title: 'Error al activar tabla', description: parseFirebaseError(err), color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Equipos ───────────────────────────────────────────────────────────────

  async function getAllGroups(tournamentId: string): Promise<Group[]> {
    loading.value = true
    try {
      return await groupService.findByTournament(tournamentId)
    } catch (err: unknown) {
      toast.add({ title: 'Error al cargar grupos', description: parseFirebaseError(err), color: 'error' })
      return []
    } finally {
      loading.value = false
    }
  }

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
      toast.add({ title: 'Error', description: parseFirebaseError(err), color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    activateMatch,
    closeMatch,
    updateMatchTeams,
    getPendingBoards,
    activateBoard,
    getTeams,
    createTeam,
    getAllGroups
  }
}
