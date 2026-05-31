/**
 * MatchService — Lógica de gestión de partidos (admin)
 * El cierre de un partido dispara el recálculo de puntos y posiciones.
 */
import { matchRepository } from '~/repositories/match.repository'
import { teamRepository } from '~/repositories/team.repository'
import type { Match } from '~/types'

export class MatchService {
  async findByTournament(tournamentId: string): Promise<Match[]> {
    return matchRepository.findByTournament(tournamentId)
  }

  /** Retorna solo los partidos visibles para usuarios finales. */
  async findVisibleByTournament(tournamentId: string): Promise<Match[]> {
    return matchRepository.findVisibleByTournament(tournamentId)
  }

  async findActive(): Promise<Match[]> {
    return matchRepository.findActive()
  }

  async findClosed(): Promise<Match[]> {
    return matchRepository.findClosed()
  }

  async findById(matchId: string): Promise<Match | null> {
    return matchRepository.findById(matchId)
  }

  async activateMatch(matchId: string): Promise<void> {
    await matchRepository.activateMatch(matchId)
  }

  async updateTeams(matchId: string, localTeamId: string, visitorTeamId: string): Promise<void> {
    const [local, visitor] = await Promise.all([
      teamRepository.findById(localTeamId),
      teamRepository.findById(visitorTeamId)
    ])
    await matchRepository.updateTeams(
      matchId,
      localTeamId,
      visitorTeamId,
      local?.name ?? '',
      local?.logoUrl ?? '',
      visitor?.name ?? '',
      visitor?.logoUrl ?? ''
    )
    // Publicación progresiva: al definir ambos equipos, el partido se vuelve
    // visible para usuarios finales automáticamente.
    if (localTeamId && visitorTeamId) {
      await matchRepository.update(matchId, { visible: true })
    }
  }

  /**
   * Cierra un partido en Firestore.
   * Esto cambiará matches/{matchId} -> isClosed = true,
   * lo que a su vez disparará la Cloud Function onMatchClosed
   * para recalcular puntos, stats de boards y ranking del grupo.
   */
  async closeMatch(
    matchId: string,
    localGoals: number,
    visitorGoals: number,
    localGoalsOT?: number | null,
    visitorGoalsOT?: number | null,
    localPenalties?: number | null,
    visitorPenalties?: number | null
  ): Promise<void> {
    const { $firebaseAuth } = useNuxtApp() as unknown as {
      $firebaseAuth: import('firebase/auth').Auth
    }
    const currentUser = $firebaseAuth.currentUser
    if (!currentUser) {
      throw new Error('No hay usuario autenticado.')
    }
    const idToken = await currentUser.getIdToken()

    await $fetch<{ success: boolean }>('/api/admin/match/close', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      body: {
        matchId,
        localGoals,
        visitorGoals,
        localGoalsOT,
        visitorGoalsOT,
        localPenalties,
        visitorPenalties
      }
    })
  }
}

export const matchService = new MatchService()
