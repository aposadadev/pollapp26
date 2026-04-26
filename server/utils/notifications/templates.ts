/**
 * Notification templates — Server-side
 *
 * Each template receives context data and returns the FCM payload.
 */
import type {
  NotificationType,
  NotificationTemplate,
  FcmPayload,
  MatchReminderData
} from './types'

const matchReminderTemplate: NotificationTemplate<MatchReminderData> = {
  build(data): FcmPayload {
    const hoursText = data.hoursAhead === 1 ? '1 hora' : `${data.hoursAhead} horas`

    return {
      notification: {
        title: `⚽ ${data.localTeamName} vs ${data.visitorTeamName}`,
        body: `El partido empieza en ${hoursText} (${data.matchTime}). ¡No olvides poner tu pronóstico!`
      },
      data: {
        url: '/',
        tag: `match-reminder-${data.matchId}`,
        type: 'match_reminder',
        matchId: data.matchId
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TEMPLATES: Record<NotificationType, NotificationTemplate<any>> = {
  match_reminder: matchReminderTemplate
}
