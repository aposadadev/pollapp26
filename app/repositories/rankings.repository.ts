/**
 * RankingsRepository — Realtime Database
 * Gestiona la tabla de posiciones en tiempo real.
 * El resto de la app usa Firestore; este repository es el único que accede a RTDB.
 *
 * IMPORTANTE: rtdb se resuelve de forma lazy en cada operación mediante useNuxtApp()
 * para garantizar que el plugin de Firebase ya esté inicializado.
 */
import {
  ref as rtdbRef,
  set,
  onValue,
  off,
  type Database,
  type DatabaseReference,
  type Unsubscribe
} from 'firebase/database'
import type { GroupRanking, RankingEntry } from '~/types'

function getRtdb(): Database {
  const rtdb = useNuxtApp().$firebaseRtdb as Database | null
  if (!rtdb) throw new Error('Realtime Database no está configurado. Verifica NUXT_PUBLIC_FIREBASE_DATABASE_URL en .env')
  return rtdb
}

export class RankingsRepository {
  private groupRef(groupId: string): DatabaseReference {
    return rtdbRef(getRtdb(), `rankings/${groupId}`)
  }

  /** Escribe el ranking completo de un grupo */
  async write(groupId: string, entries: RankingEntry[]): Promise<void> {
    await set(this.groupRef(groupId), {
      updatedAt: Date.now(),
      entries
    })
  }

  /** Suscripción en tiempo real a las posiciones de un grupo */
  subscribe(groupId: string, callback: (ranking: GroupRanking | null) => void): Unsubscribe {
    const ref = this.groupRef(groupId)
    onValue(ref, (snap) => {
      if (!snap.exists()) {
        callback(null)
        return
      }
      const data = snap.val() as { updatedAt: number, entries: RankingEntry[] }
      callback({
        groupId,
        updatedAt: data.updatedAt,
        entries: data.entries ?? []
      })
    })
    return () => off(ref)
  }

  /** Lectura única (sin suscripción) */
  async read(groupId: string): Promise<GroupRanking | null> {
    return new Promise((resolve) => {
      const ref = this.groupRef(groupId)
      onValue(ref, (snap) => {
        off(ref)
        if (!snap.exists()) {
          resolve(null)
          return
        }
        const data = snap.val() as { updatedAt: number, entries: RankingEntry[] }
        resolve({ groupId, updatedAt: data.updatedAt, entries: data.entries ?? [] })
      }, { onlyOnce: true })
    })
  }
}

export const rankingsRepository = new RankingsRepository()
