import type { Firestore } from 'firebase/firestore'
import { BaseRepository } from './base.repository'
import type { Match } from '~/types'



export class MatchRepository extends BaseRepository<Match> {
  constructor() {
    super('matches')
  }

  async findByTournament(tournamentId: string): Promise<Match[]> {
    const all = await this.findAll()
    return all
      .filter(m => m.tournamentId === tournamentId)
      .sort((a, b) => a.matchNumber - b.matchNumber)
  }

  async findActive(): Promise<Match[]> {
    const all = await this.findAll()
    return all
      .filter(m => !m.isClosed)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  async findClosed(): Promise<Match[]> {
    const all = await this.findAll()
    return all
      .filter(m => m.isClosed)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
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

  async updateTeams(matchId: string, localTeamId: string, visitorTeamId: string): Promise<void> {
    await this.update(matchId, { localTeamId, visitorTeamId })
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
      createdAt: (data['createdAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
    }
  }
}

export const matchRepository = new MatchRepository()
