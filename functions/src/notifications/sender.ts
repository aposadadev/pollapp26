/**
 * Sistema de notificaciones push — Sender
 *
 * Abstrae el envío de notificaciones FCM. Cualquier función (scheduled,
 * trigger, callable) usa este sender en lugar de llamar directamente
 * al Admin SDK de Messaging.
 *
 * Características:
 * - Envío en lote (hasta 500 tokens por llamada via sendEachForMulticast)
 * - Limpieza automática de tokens inválidos (elimina de Firestore)
 * - Logging de resultados para debugging en Cloud Logging
 */
import * as admin from 'firebase-admin'
import type { FcmPayload, NotificationType, MatchReminderData } from './types.js'
import { TEMPLATES } from './templates.js'

const MAX_TOKENS_PER_BATCH = 500 // Límite de FCM sendEachForMulticast

/**
 * Envía una notificación a un conjunto de tokens FCM.
 * Limpia los tokens inválidos de Firestore automáticamente.
 *
 * @param tokens   Tokens FCM de los destinatarios
 * @param payload  Payload generado por un template
 * @param userIds  IDs de los usuarios dueños de los tokens (mismo orden que tokens)
 *                 Necesarios para limpiar tokens inválidos de Firestore
 */
export async function sendToTokens(
  tokens: string[],
  payload: FcmPayload,
  userIds?: string[]
): Promise<{ sent: number, failed: number }> {
  if (!tokens.length) return { sent: 0, failed: 0 }

  const messaging = admin.messaging()
  let totalSent = 0
  let totalFailed = 0

  // Procesar en lotes de MAX_TOKENS_PER_BATCH
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

    // Limpiar tokens inválidos de Firestore
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
      await _cleanInvalidTokens(invalidTokens)
      console.log(`[FCM] Limpiados ${invalidTokens.length} tokens inválidos`)
    }
  }

  console.log(`[FCM] Enviados: ${totalSent}, Fallidos: ${totalFailed}`)
  return { sent: totalSent, failed: totalFailed }
}

/**
 * Helper tipado: construye el payload desde un template y envía.
 * Esta es la función principal que usan las Cloud Functions.
 *
 * Ejemplo:
 * await sendNotification('match_reminder', data, tokens, userIds)
 */
export async function sendNotification<T>(
  type: NotificationType,
  data: T,
  tokens: string[],
  userIds?: string[]
): Promise<{ sent: number, failed: number }> {
  const template = TEMPLATES[type]
  if (!template) {
    console.error(`[FCM] Template no encontrado para tipo: ${type}`)
    return { sent: 0, failed: 0 }
  }
  const payload = template.build(data)
  return sendToTokens(tokens, payload, userIds)
}

// ── Internos ──────────────────────────────────────────────────────────────────

async function _cleanInvalidTokens(
  items: Array<{ userId: string, token: string }>
): Promise<void> {
  const db = admin.firestore()
  const { FieldValue } = admin.firestore

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

// Re-exportar tipos comunes que las functions necesitan
export type { MatchReminderData }
