import { BaseRepository } from './base.repository'
import type { Group } from '~/types'

export class GroupRepository extends BaseRepository<Group> {
  constructor() {
    super('groups')
  }

  async findByTournament(tournamentId: string): Promise<Group[]> {
    const results = await this.findAll([
      this.where('tournamentId', '==', tournamentId),
      this.where('isActive', '==', true)
    ])
    return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async findByOwner(ownerId: string): Promise<Group[]> {
    const results = await this.findAll([
      this.where('ownerId', '==', ownerId)
    ])
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findByCode(code: string): Promise<Group | null> {
    const results = await this.findWhere('code', '==', code.toUpperCase())
    return results[0] ?? null
  }

  async deactivate(groupId: string): Promise<void> {
    await this.update(groupId, { isActive: false })
  }

  protected override mapDoc(id: string, data: Record<string, unknown>): Group {
    return {
      id,
      name: data['name'] as string ?? '',
      code: data['code'] as string ?? '',
      ownerId: data['ownerId'] as string ?? '',
      ownerName: data['ownerName'] as string | undefined,
      tournamentId: data['tournamentId'] as string ?? '',
      isActive: data['isActive'] as boolean ?? true,
      createdAt: (data['createdAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
    }
  }
}

export const groupRepository = new GroupRepository()
