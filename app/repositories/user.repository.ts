import { BaseRepository } from './base.repository'
import type { UserProfile } from '~/types'

export class UserRepository extends BaseRepository<UserProfile> {
  constructor() {
    super('users')
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const results = await this.findWhere('email', '==', email)
    return results[0] ?? null
  }

  async findAdmins(): Promise<UserProfile[]> {
    const all = await this.findAll()
    return all.filter(u => u.isAdmin)
  }

  async createProfile(uid: string, data: Omit<UserProfile, 'id' | 'createdAt'>): Promise<void> {
    await this.createWithId(uid, data)
  }

  async setAdmin(uid: string, isAdmin: boolean): Promise<void> {
    await this.update(uid, { isAdmin })
  }

  protected override mapDoc(id: string, data: Record<string, unknown>): UserProfile {
    return {
      id,
      displayName: data['displayName'] as string ?? '',
      firstName: data['firstName'] as string ?? '',
      lastName: data['lastName'] as string ?? '',
      email: data['email'] as string ?? '',
      isAdmin: data['isAdmin'] as boolean ?? false,
      photoURL: data['photoURL'] as string | undefined,
      createdAt: (data['createdAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
    }
  }
}

export const userRepository = new UserRepository()
