import { arrayUnion, arrayRemove, doc, updateDoc } from 'firebase/firestore'
import { BaseRepository } from './base.repository'
import type { UserProfile, NotificationPrefs } from '~/types'

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

  // ── Push Notifications ──────────────────────────────────────────────────────

  /**
   * Agrega un token FCM al usuario (arrayUnion evita duplicados).
   * Llamar cuando el usuario da permiso de notificaciones en un nuevo dispositivo.
   */
  async saveFcmToken(userId: string, token: string): Promise<void> {
    const db = useNuxtApp().$firestore as import('firebase/firestore').Firestore
    await updateDoc(doc(db, 'users', userId), {
      fcmTokens: arrayUnion(token)
    })
  }

  /**
   * Elimina un token FCM del usuario.
   * Llamar cuando el usuario desactiva notificaciones o cuando el token expira.
   */
  async removeFcmToken(userId: string, token: string): Promise<void> {
    const db = useNuxtApp().$firestore as import('firebase/firestore').Firestore
    await updateDoc(doc(db, 'users', userId), {
      fcmTokens: arrayRemove(token)
    })
  }

  /**
   * Actualiza las preferencias de notificación del usuario.
   */
  async updateNotificationPrefs(userId: string, prefs: NotificationPrefs): Promise<void> {
    await this.update(userId, { notificationPrefs: prefs })
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
      createdAt: (data['createdAt'] as { toDate?: () => Date })?.toDate?.() ?? new Date(),
      fcmTokens: data['fcmTokens'] as string[] | undefined,
      notificationPrefs: data['notificationPrefs'] as NotificationPrefs | undefined
    }
  }
}

export const userRepository = new UserRepository()
