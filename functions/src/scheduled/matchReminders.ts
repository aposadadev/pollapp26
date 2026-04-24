/**
 * matchReminders — Cloud Function programada
 *
 * Se ejecuta cada 30 minutos. Busca partidos que estén programados para
 * comenzar en exactamente X horas (según las prefs de cada usuario) y envía
 * una notificación push a todos los usuarios suscritos.
 *
 * Diseño:
 * - "Ventana de tiempo": cada ejecución cubre 30 min (la frecuencia del cron).
 *   Un partido con hora H recibirá la notificación en la ejecución entre H-Xh y H-Xh+30min.
 * - Cada usuario puede tener prefs diferentes (1h, 2h o 4h de anticipación).
 *   Agrupamos los envíos para no hacer N queries por usuario.
 *
 * Para agregar más recordatorios en el futuro:
 * - Agrega el tipo en notifications/types.ts
 * - Crea el template en notifications/templates.ts
 * - Llama a sendNotification() aquí o en una nueva scheduled function
 */
import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { sendNotification } from '../notifications/sender.js'
import type { MatchReminderData } from '../notifications/sender.js'

const db = () => admin.firestore()

// ── Configuración ──────────────────────────────────────────────────────────────

/** Frecuencia del cron. Debe coincidir con el schedule de abajo. */
const CRON_INTERVAL_MINUTES = 30

/** Horas de anticipación soportadas (deben coincidir con NotificationPrefs en el cliente) */
const SUPPORTED_REMINDER_HOURS = [1, 2, 4] as const

// ── Handler ────────────────────────────────────────────────────────────────────

export const sendMatchReminders = onSchedule(
  {
    schedule: `every ${CRON_INTERVAL_MINUTES} minutes`,
    timeZone: 'America/Mexico_City',
    // Memoria mínima es suficiente para este job
    memory: '256MiB'
  },
  async () => {
    const now = new Date()
    console.log(`[matchReminders] Ejecutando a: ${now.toISOString()}`)

    // Para cada ventana de anticipación, buscar y enviar
    await Promise.all(
      SUPPORTED_REMINDER_HOURS.map(hours => _processWindow(now, hours))
    )
  }
)

// ── Internos ──────────────────────────────────────────────────────────────────

/**
 * Procesa la ventana de anticipación `hoursAhead`:
 * Busca partidos que comiencen entre (now + hoursAhead) y (now + hoursAhead + INTERVAL)
 * y envía notificaciones a usuarios con esa preferencia configurada.
 */
async function _processWindow(now: Date, hoursAhead: number): Promise<void> {
  const windowStart = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
  const windowEnd = new Date(windowStart.getTime() + CRON_INTERVAL_MINUTES * 60 * 1000)

  // Buscar partidos que comiencen en esta ventana
  const matchesSnap = await db()
    .collection('matches')
    .where('status', '==', 'scheduled')
    .where('date', '>=', admin.firestore.Timestamp.fromDate(windowStart))
    .where('date', '<', admin.firestore.Timestamp.fromDate(windowEnd))
    .get()

  if (matchesSnap.empty) {
    console.log(`[matchReminders] Sin partidos en ventana +${hoursAhead}h`)
    return
  }

  console.log(`[matchReminders] ${matchesSnap.size} partido(s) en ventana +${hoursAhead}h`)

  // Buscar todos los usuarios con FCM tokens que tengan matchReminder activo
  // y con reminderHoursBeforeMatch === hoursAhead
  const usersSnap = await db()
    .collection('users')
    .where('notificationPrefs.matchReminder', '==', true)
    .where('notificationPrefs.reminderHoursBeforeMatch', '==', hoursAhead)
    .get()

  if (usersSnap.empty) {
    console.log(`[matchReminders] Sin usuarios suscritos a +${hoursAhead}h`)
    return
  }

  // Construir listas de tokens + userIds
  const tokens: string[] = []
  const userIds: string[] = []

  for (const userDoc of usersSnap.docs) {
    const fcmTokens = userDoc.data()['fcmTokens'] as string[] | undefined
    if (!fcmTokens?.length) continue
    for (const token of fcmTokens) {
      tokens.push(token)
      userIds.push(userDoc.id)
    }
  }

  if (!tokens.length) {
    console.log(`[matchReminders] Sin tokens válidos para +${hoursAhead}h`)
    return
  }

  // Enviar una notificación por partido a todos los usuarios suscritos
  for (const matchDoc of matchesSnap.docs) {
    const match = matchDoc.data()

    // Formatear hora del partido en zona horaria local
    const matchDate = (match['date'] as admin.firestore.Timestamp).toDate()
    const matchTime = matchDate.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    })

    const data: MatchReminderData = {
      matchId: matchDoc.id,
      localTeamName: match['localTeamName'] as string ?? 'Local',
      visitorTeamName: match['visitorTeamName'] as string ?? 'Visitante',
      matchTime,
      hoursAhead
    }

    const result = await sendNotification('match_reminder', data, tokens, userIds)
    console.log(
      `[matchReminders] Partido ${matchDoc.id}: enviados=${result.sent}, fallidos=${result.failed}`
    )
  }
}
