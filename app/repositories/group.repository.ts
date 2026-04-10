import { where } from 'firebase/firestore'
import { BaseRepository } from './base.repository'
import type { Group, GroupWithBoardStatus } from '~/types'

export class GroupRepository extends BaseRepository<Group> {
  constructor() {
    super('groups')
  }

  async findByTournament(tournamentId: string): Promise<Group[]> {
    const all = await this.findAll()
    return all
      .filter(g => g.tournamentId === tournamentId && g.isActive)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async findByCode(code: string): Promise<Group | null> {
    const results = await this.findWhere('code', '==', code.toUpperCase())
    return results[0] ?? null
  }

  async findByOwner(ownerId: string): Promise<Group[]> {
    const all = await this.findAll()
    return all
      .filter(g => g.ownerId === ownerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findAll(): Promise<Group[]> {
    const all = await super.findAll()
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
