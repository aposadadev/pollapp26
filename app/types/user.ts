/**
 * Preferencias de notificación push por tipo.
 * Agregar nuevos tipos aquí para que el usuario pueda configurarlos individualmente.
 */
export interface NotificationPrefs {
  /** Recordatorio antes de que empiece un partido (horas configurables) */
  matchReminder: boolean
  /** Horas de anticipación para el recordatorio (1, 2 o 4) */
  reminderHoursBeforeMatch: 1 | 2 | 4
  // 👇 Agrega más tipos de notificación aquí en el futuro:
  // matchStarted: boolean      — cuando un partido pasa a "En Vivo"
  // matchClosed: boolean       — cuando se cierra y se publican los puntos
  // rankingUpdate: boolean     — cuando cambian las posiciones
}

export interface UserProfile {
  id: string
  displayName: string
  firstName: string
  lastName: string
  email: string
  isAdmin: boolean
  photoURL?: string
  createdAt: Date
  /** Tokens FCM por dispositivo. Puede haber más de uno (PC + móvil). */
  fcmTokens?: string[]
  /** Preferencias de notificación push del usuario. */
  notificationPrefs?: NotificationPrefs
}
