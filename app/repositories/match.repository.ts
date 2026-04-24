import { BaseRepository } from './base.repository'
import { isMatchVisible } from '~/types/match'
import type { Match } from '~/types'

export class MatchRepository extends BaseRepository<Match> {
  constructor() {
    super('matches')
  }

  /**
   * Retorna todos los partidos de un torneo, sin filtro de visibilidad.
   * Semántica legacy — conservada para no romper callers existentes.
   * @deprecated Preferir `findVisibleByTournament` (usuarios) o
   *             `findByTournamentAdmin` (admin) según el contexto.
   */
  async findByTournament(tournamentId: string): Promise<Match[]> {
    const all = await this.findAll([
      this.where('tournamentId', '==', tournamentId)
    ])
    return all.sort((a, b) => a.matchNumber - b.matchNumber)
  }

  /**
   * Ruta para usuarios finales: retorna solo los partidos visibles del torneo.
   * Un partido es visible si `visible !== false` (fallback seguro para legacy).
   */
  async findVisibleByTournament(tournamentId: string): Promise<Match[]> {
    const all = await this.findByTournament(tournamentId)
    return all.filter(m => isMatchVisible(m))
  }

  /**
   * Ruta para admin: retorna todos los partidos del torneo sin filtro de
   * visibilidad. Equivalente a `findByTournament` pero con semántica explícita.
   */
  async findByTournamentAdmin(tournamentId: string): Promise<Match[]> {
    return this.findByTournament(tournamentId)
  }

  async findActive(): Promise<Match[]> {
    // Migrado a `status` — usa 'in' para obtener partidos scheduled + active.
    // Semánticamente equivalente al legacy `isClosed == false`.
    // Requiere que todos los docs tengan `status`; ejecutar backfill antes de
    // desplegar en producción: `pnpm backfill:match-status`
    const all = await this.findAll([
      this.where('status', 'in', ['scheduled', 'active'])
    ])
    return all.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  async findClosed(): Promise<Match[]> {
    // Migrado a `status` — closeMatch siempre escribe status='closed' desde PR3.
    const all = await this.findAll([
      this.where('status', '==', 'closed')
    ])
    return all.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  async closeMatch(matchId: string, localGoals: number, visitorGoals: number): Promise<void> {
    await this.update(matchId, {
      localGoals,
      visitorGoals,
      isClosed: true,
      isActive: false,
      status: 'closed'
    })
  }

  async activateMatch(matchId: string): Promise<void> {
    await this.update(matchId, {
      isActive: true,
      status: 'active'
    })
  }

  async updateTeams(
    matchId: string,
    localTeamId: string,
    visitorTeamId: string,
    localTeamName: string,
    localTeamLogo: string,
    visitorTeamName: string,
    visitorTeamLogo: string
  ): Promise<void> {
    await this.update(matchId, {
      localTeamId,
      visitorTeamId,
      localTeamName,
      localTeamLogo,
      visitorTeamName,
      visitorTeamLogo
    })
  }

  protected override mapDoc(id: string, data: Record<string, unknown>): Match {
    return {
      id,
      tournamentId: data['tournamentId'] as string ?? '',
      localTeamId: data['localTeamId'] as string ?? '',
      visitorTeamId: data['visitorTeamId'] as string ?? '',
      localTeamName: data['localTeamName'] as string | undefined,
      visitorTeamName: data['visitorTeamName'] as string | undefined,
      localTeamLogo: data['localTeamLogo'] as string | undefined,
      visitorTeamLogo: data['visitorTeamLogo'] as string | undefined,
      localGoals: data['localGoals'] as number | null ?? null,
      visitorGoals: data['visitorGoals'] as number | null ?? null,
      date: (data['date'] as { toDate?: () => Date })?.toDate?.() ?? new Date(),
      phase: data['phase'] as Match['phase'] ?? 'Fase de Grupos',
      matchNumber: data['matchNumber'] as number ?? 0,
      status: data['status'] as Match['status'] ?? 'scheduled',
      isActive: data['isActive'] as boolean ?? false,
      isClosed: data['isClosed'] as boolean ?? false,
      visible: data['visible'] as boolean | undefined,
      createdAt: (data['createdAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
    }
  }
}

export const matchRepository = new MatchRepository()
