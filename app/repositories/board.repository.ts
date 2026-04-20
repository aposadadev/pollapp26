import { where, writeBatch, doc, runTransaction, type Firestore } from 'firebase/firestore'
import { BaseRepository } from './base.repository'
import type { Board } from '~/types'

function getDb(): Firestore {
  return useNuxtApp().$firestore as Firestore
}

export class BoardRepository extends BaseRepository<Board> {
  constructor() {
    super('boards')
  }

  async findByUser(userId: string): Promise<Board[]> {
    const all = await this.findAll([
      where('userId', '==', userId)
    ])
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findByGroup(groupId: string): Promise<Board[]> {
    const all = await this.findAll([
      where('groupId', '==', groupId)
    ])
    return all.sort((a, b) => a.currentPos - b.currentPos)
  }

  async findActiveByGroup(groupId: string): Promise<Board[]> {
    const all = await this.findAll([
      where('groupId', '==', groupId),
      where('isActive', '==', true)
    ])
    return all.sort((a, b) => a.currentPos - b.currentPos)
  }

  async findPendingByGroup(groupId: string): Promise<Board[]> {
    const all = await this.findAll([
      where('groupId', '==', groupId),
      where('isActive', '==', false)
    ])
    return all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async findByUserAndGroup(userId: string, groupId: string): Promise<Board | null> {
    const results = await this.findAll([
      where('userId', '==', userId),
      where('groupId', '==', groupId)
    ])
    return results[0] ?? null
  }

  /**
   * Creates a board and atomically assigns it a unique sequential number within
   * the group, using a Firestore transaction on a counter document so that
   * concurrent requests can never collide on the same number.
   */
  async createWithNumber(data: Omit<Board, 'id' | 'createdAt' | 'number'>): Promise<{ id: string; number: number }> {
    const db = getDb()
    const counterRef = doc(db, '_counters', `board_count_${data.groupId}`)

    return runTransaction(db, async (txn) => {
      const counterSnap = await txn.get(counterRef)
      const currentCount: number = counterSnap.exists() ? (counterSnap.data()['count'] as number ?? 0) : 0
      const number = 1000 + currentCount + 1

      const newBoardRef = doc(db, 'boards')
      txn.set(newBoardRef, {
        ...data,
        number,
        createdAt: new Date()
      })
      txn.set(counterRef, { count: currentCount + 1 }, { merge: true })

      return { id: newBoardRef.id, number }
    })
  }

  async activate(boardId: string): Promise<void> {
    await this.update(boardId, { isActive: true })
  }

  async updateStats(
    boardId: string,
    stats: Pick<Board, 'totalPoints' | 'predsThreePoints' | 'predsOnePoints' | 'currentPos' | 'previousPos'>
  ): Promise<void> {
    await this.update(boardId, stats)
  }

  /** Actualiza solo los puntos de un board, sin tocar currentPos/previousPos */
  async updatePointsStats(
    boardId: string,
    stats: Pick<Board, 'totalPoints' | 'predsThreePoints' | 'predsOnePoints'>
  ): Promise<void> {
    await this.update(boardId, stats)
  }

  /** Actualiza posiciones de múltiples boards en batch */
  async batchUpdatePositions(
    updates: Array<{
      boardId: string
      currentPos: number
      previousPos: number
      totalPoints: number
      predsThreePoints: number
      predsOnePoints: number
    }>
  ): Promise<void> {
    const db = getDb()
    const batch = writeBatch(db)
    for (const u of updates) {
      const ref = doc(db, 'boards', u.boardId)
      batch.update(ref, {
        currentPos: u.currentPos,
        previousPos: u.previousPos,
        totalPoints: u.totalPoints,
        predsThreePoints: u.predsThreePoints,
        predsOnePoints: u.predsOnePoints
      })
    }
    await batch.commit()
  }

  protected override mapDoc(id: string, data: Record<string, unknown>): Board {
    return {
      id,
      userId: data['userId'] as string ?? '',
      userDisplayName: data['userDisplayName'] as string | undefined,
      groupId: data['groupId'] as string ?? '',
      groupName: data['groupName'] as string | undefined,
      tournamentId: data['tournamentId'] as string ?? '',
      number: data['number'] as number ?? 0,
      isActive: data['isActive'] as boolean ?? false,
      totalPoints: data['totalPoints'] as number ?? 0,
      predsThreePoints: data['predsThreePoints'] as number ?? 0,
      predsOnePoints: data['predsOnePoints'] as number ?? 0,
      currentPos: data['currentPos'] as number ?? 0,
      previousPos: data['previousPos'] as number ?? 0,
      createdAt: (data['createdAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
    }
  }
}

export const boardRepository = new BoardRepository()
