/**
 * Sistema de notificaciones push — Tipos
 *
 * Para agregar un nuevo tipo de notificación:
 * 1. Agrega el valor a NotificationType
 * 2. Crea el template en templates.ts
 * 3. Llama a sendNotification() con el nuevo tipo desde donde corresponda
 *    (scheduled function, trigger de Firestore, callable, etc.)
 */

// ── Tipos de notificación disponibles ─────────────────────────────────────────

export type NotificationType
  = | 'match_reminder' // Recordatorio antes de que empiece un partido
  // 👇 Agrega nuevos tipos aquí:
  // | 'match_started'    // Partido pasó a En Vivo
  // | 'match_closed'     // Partido cerrado, ya hay puntos
  // | 'ranking_update'   // Cambio de posiciones en la tabla

// ── Contexto de datos para cada tipo ─────────────────────────────────────────

export interface MatchReminderData {
  matchId: string
  localTeamName: string
  visitorTeamName: string
  /** Hora de inicio del partido en formato HH:mm */
  matchTime: string
  /** Nombre del grupo para personalizar la notificación */
  groupName?: string
  /** Horas de anticipación del recordatorio */
  hoursAhead: number
}

// Agregar nuevas interfaces de datos cuando se agreguen nuevos tipos:
// export interface MatchStartedData { matchId: string; ... }

// ── Payload FCM ───────────────────────────────────────────────────────────────

export interface FcmPayload {
  /** Mostrado en la notificación del sistema */
  notification: {
    title: string
    body: string
  }
  /** Datos extra para el SW (URL de navegación, tag para dedup, etc.) */
  data: {
    url: string
    tag: string
    type: NotificationType
    [key: string]: string
  }
}

// ── Interfaz de un template de notificación ───────────────────────────────────

export interface NotificationTemplate<TData> {
  /** Genera el payload FCM a partir de los datos del contexto */
  build(data: TData): FcmPayload
}
