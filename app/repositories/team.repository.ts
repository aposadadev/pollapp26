import { BaseRepository } from './base.repository'
import type { Team } from '~/types'

export class TeamRepository extends BaseRepository<Team> {
  constructor() {
    super('teams')
  }

  override async findAll(): Promise<Team[]> {
    const all = await super.findAll()
    return all.sort((a, b) => a.name.localeCompare(b.name))
  }

  async findByName(name: string): Promise<Team | null> {
    const results = await this.findWhere('name', '==', name)
    return results[0] ?? null
  }

  protected override mapDoc(id: string, data: Record<string, unknown>): Team {
    return {
      id,
      name: data['name'] as string ?? '',
      shortName: data['shortName'] as string ?? '',
      logoUrl: data['logoUrl'] as string ?? '',
      country: data['country'] as string ?? '',
      createdAt: (data['createdAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
    }
  }
}

export const teamRepository = new TeamRepository()
