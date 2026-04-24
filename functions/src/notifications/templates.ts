/**
 * Sistema de notificaciones push — Templates
 *
 * Cada template recibe los datos de contexto y retorna el payload FCM.
 * Para agregar un nuevo tipo:
 * 1. Crear la interfaz de datos en types.ts
 * 2. Agregar el template aquí
 * 3. Registrarlo en el mapa TEMPLATES al final del archivo
 */
import type {
  NotificationType,
  NotificationTemplate,
  FcmPayload,
  MatchReminderData
} from './types.js'

// ── match_reminder ─────────────────────────────────────────────────────────────

const matchReminderTemplate: NotificationTemplate<MatchReminderData> = {
  build(data): FcmPayload {
    const hoursText = data.hoursAhead === 1 ? '1 hora' : `${data.hoursAhead} horas`

    return {
      notification: {
        title: `⚽ ${data.localTeamName} vs ${data.visitorTeamName}`,
        body: `El partido empieza en ${hoursText} (${data.matchTime}). ¡No olvides poner tu pronóstico!`
      },
      data: {
        url: '/', // La Cloud Function reemplaza esto con la URL del board
        tag: `match-reminder-${data.matchId}`,
        type: 'match_reminder',
        matchId: data.matchId
      }
    }
  }
}

// ── Registro de templates ──────────────────────────────────────────────────────
// Agrega nuevos templates aquí para que sean reconocidos por el sender.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TEMPLATES: Record<NotificationType, NotificationTemplate<any>> = {
  match_reminder: matchReminderTemplate
  // match_started: matchStartedTemplate,
  // match_closed: matchClosedTemplate,
}
