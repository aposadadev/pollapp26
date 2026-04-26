/**
 * GET /api/cron/match-reminders
 *
 * Sends push notifications to users who have match reminder preferences enabled.
 * Called automatically by Vercel Cron Jobs every 30 minutes.
 *
 * Security: Protected by CRON_SECRET header verification.
 * Vercel automatically sends this header when invoking cron jobs.
 *
 * Logic:
 * - For each supported reminder window (1h, 2h, 4h ahead):
 *   - Find matches starting in that window
 *   - Find users subscribed to that window
 *   - Send FCM notifications
 */
import { Timestamp } from 'firebase-admin/firestore'

const CRON_INTERVAL_MINUTES = 30
const SUPPORTED_REMINDER_HOURS = [1, 2, 4] as const

export default defineEventHandler(async (event) => {
  // Verify cron secret — Vercel sends this automatically for cron jobs
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')

  if (authHeader !== `Bearer ${config.cronSecret}`) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: invalid cron secret.'
    })
  }

  const now = new Date()
  console.log(`[matchReminders] Running at: ${now.toISOString()}`)

  const results = await Promise.all(
    SUPPORTED_REMINDER_HOURS.map(hours => processWindow(now, hours))
  )

  const totalSent = results.reduce((sum, r) => sum + r.sent, 0)
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)

  return {
    success: true,
    timestamp: now.toISOString(),
    sent: totalSent,
    failed: totalFailed
  }
})

async function processWindow(
  now: Date,
  hoursAhead: number
): Promise<{ sent: number, failed: number }> {
  const db = getAdminDb()
  const windowStart = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
  const windowEnd = new Date(windowStart.getTime() + CRON_INTERVAL_MINUTES * 60 * 1000)

  // Find matches starting in this window
  const matchesSnap = await db
    .collection('matches')
    .where('status', '==', 'scheduled')
    .where('date', '>=', Timestamp.fromDate(windowStart))
    .where('date', '<', Timestamp.fromDate(windowEnd))
    .get()

  if (matchesSnap.empty) {
    console.log(`[matchReminders] No matches in +${hoursAhead}h window`)
    return { sent: 0, failed: 0 }
  }

  console.log(`[matchReminders] ${matchesSnap.size} match(es) in +${hoursAhead}h window`)

  // Find users with FCM tokens and matching reminder prefs
  const usersSnap = await db
    .collection('users')
    .where('notificationPrefs.matchReminder', '==', true)
    .where('notificationPrefs.reminderHoursBeforeMatch', '==', hoursAhead)
    .get()

  if (usersSnap.empty) {
    console.log(`[matchReminders] No subscribed users for +${hoursAhead}h`)
    return { sent: 0, failed: 0 }
  }

  // Build token + userId lists
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
    console.log(`[matchReminders] No valid tokens for +${hoursAhead}h`)
    return { sent: 0, failed: 0 }
  }

  let totalSent = 0
  let totalFailed = 0

  // Send one notification per match to all subscribed users
  for (const matchDoc of matchesSnap.docs) {
    const match = matchDoc.data()
    const matchDate = (match['date'] as Timestamp).toDate()
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
    totalSent += result.sent
    totalFailed += result.failed
    console.log(
      `[matchReminders] Match ${matchDoc.id}: sent=${result.sent}, failed=${result.failed}`
    )
  }

  return { sent: totalSent, failed: totalFailed }
}
