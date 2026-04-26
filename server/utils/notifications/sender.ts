/**
 * Notification sender — Server-side
 *
 * Abstracts FCM push notification sending via firebase-admin.
 * Handles batching (500 tokens per call) and automatic cleanup
 * of invalid tokens from Firestore.
 */
import { FieldValue } from 'firebase-admin/firestore'
import type { NotificationType, FcmPayload } from './types'
import { TEMPLATES } from './templates'

const MAX_TOKENS_PER_BATCH = 500

/**
 * Sends a notification to a set of FCM tokens.
 * Automatically cleans up invalid tokens from Firestore.
 */
export async function sendToTokens(
  tokens: string[],
  payload: FcmPayload,
  userIds?: string[]
): Promise<{ sent: number, failed: number }> {
  if (!tokens.length) return { sent: 0, failed: 0 }

  const messaging = getAdminMessaging()
  let totalSent = 0
  let totalFailed = 0

  for (let i = 0; i < tokens.length; i += MAX_TOKENS_PER_BATCH) {
    const batchTokens = tokens.slice(i, i + MAX_TOKENS_PER_BATCH)
    const batchUserIds = userIds?.slice(i, i + MAX_TOKENS_PER_BATCH) ?? []

    const result = await messaging.sendEachForMulticast({
      tokens: batchTokens,
      notification: payload.notification,
      data: payload.data,
      webpush: {
        notification: {
          icon: '/pwa/icon-192.png',
          badge: '/pwa/icon-192.png',
          requireInteraction: false
        },
        fcmOptions: {
          link: payload.data.url
        }
      }
    })

    totalSent += result.successCount
    totalFailed += result.failureCount

    // Clean up invalid tokens from Firestore
    const invalidTokens: Array<{ userId: string, token: string }> = []
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code
        if (
          code === 'messaging/invalid-registration-token'
          || code === 'messaging/registration-token-not-registered'
        ) {
          const userId = batchUserIds[idx]
          if (userId) {
            invalidTokens.push({ userId, token: batchTokens[idx]! })
          }
        }
      }
    })

    if (invalidTokens.length > 0) {
      await cleanInvalidTokens(invalidTokens)
      console.log(`[FCM] Cleaned ${invalidTokens.length} invalid tokens`)
    }
  }

  console.log(`[FCM] Sent: ${totalSent}, Failed: ${totalFailed}`)
  return { sent: totalSent, failed: totalFailed }
}

/**
 * Typed helper: builds payload from a template and sends.
 */
export async function sendNotification<T>(
  type: NotificationType,
  data: T,
  tokens: string[],
  userIds?: string[]
): Promise<{ sent: number, failed: number }> {
  const template = TEMPLATES[type]
  if (!template) {
    console.error(`[FCM] Template not found for type: ${type}`)
    return { sent: 0, failed: 0 }
  }
  const payload = template.build(data)
  return sendToTokens(tokens, payload, userIds)
}

async function cleanInvalidTokens(
  items: Array<{ userId: string, token: string }>
): Promise<void> {
  const db = getAdminDb()
  const batches: Promise<unknown>[] = []
  for (const { userId, token } of items) {
    batches.push(
      db.collection('users').doc(userId).update({
        fcmTokens: FieldValue.arrayRemove(token)
      })
    )
  }
  await Promise.all(batches)
}
