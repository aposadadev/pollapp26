/**
 * Notification types — Server-side
 *
 * Mirrors the types from the old Firebase Functions notification system.
 */

export type NotificationType = 'match_reminder'

export interface MatchReminderData {
  matchId: string
  localTeamName: string
  visitorTeamName: string
  matchTime: string
  groupName?: string
  hoursAhead: number
}

export interface FcmPayload {
  notification: {
    title: string
    body: string
  }
  data: {
    url: string
    tag: string
    type: NotificationType
    [key: string]: string
  }
}

export interface NotificationTemplate<TData> {
  build(data: TData): FcmPayload
}
