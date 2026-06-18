import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore'
import type { GroupMatch } from '~/types/group-match'
import type { MatchPredictionEntry } from '~/types/prediction'

function getDb(): Firestore {
  return useNuxtApp().$firestore as Firestore
}

export class GroupMatchRepository {
  private getDocRef(groupId: string, matchId: string) {
    return doc(getDb(), 'groups', groupId, 'matches', matchId)
  }

  async findByGroupAndMatch(groupId: string, matchId: string): Promise<GroupMatch | null> {
    const snap = await getDoc(this.getDocRef(groupId, matchId))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      id: snap.id,
      matchId: data['matchId'] as string,
      groupId: data['groupId'] as string,
      predictions: data['predictions'] as MatchPredictionEntry[],
      isCalculated: data['isCalculated'] as boolean,
      updatedAt: (data['updatedAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
    }
  }

  async createOrUpdate(groupId: string, matchId: string, data: Omit<GroupMatch, 'id' | 'updatedAt'>): Promise<void> {
    await setDoc(this.getDocRef(groupId, matchId), {
      ...data,
      updatedAt: new Date()
    }, { merge: true })
  }
}

export const groupMatchRepository = new GroupMatchRepository()
