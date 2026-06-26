/**
 * external-auth.ts — API Key authentication helper
 *
 * Validates requests from external services using API keys stored in Firestore.
 * The key is never stored in plaintext — only its SHA-256 hash is persisted.
 *
 * Usage in external API routes:
 *   const { userId } = await requireApiKey(event)
 */
import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

export interface ApiKeyPayload {
  userId: string
  keyDocId: string
}

/**
 * Generates a new cryptographically secure API key.
 * Returns both the plaintext key (to show the user once) and its SHA-256 hash (to store).
 */
export function generateApiKey(): { plaintext: string, hash: string, prefix: string } {
  const raw = randomBytes(32).toString('hex')
  const plaintext = `pa_live_${raw}`
  const hash = hashApiKey(plaintext)
  const prefix = plaintext.slice(0, 16) // "pa_live_" + 8 chars = 16 chars total
  return { plaintext, hash, prefix }
}

/**
 * Returns the SHA-256 hash of a given API key.
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Extracts and validates an API key from the request.
 * Looks for `Authorization: Bearer <key>` or `X-API-Key: <key>`.
 * Throws a 401 error if the key is missing, invalid, or revoked.
 *
 * Also updates `lastUsedAt` asynchronously (fire-and-forget) to avoid adding
 * latency to the main request.
 */
export async function requireApiKey(event: H3Event): Promise<ApiKeyPayload> {
  const authorization = getHeader(event, 'authorization')
  const xApiKey = getHeader(event, 'x-api-key')

  let rawKey: string | undefined

  if (authorization?.startsWith('Bearer ')) {
    rawKey = authorization.slice(7)
  } else if (xApiKey) {
    rawKey = xApiKey
  }

  if (!rawKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'API Key requerida. Proporciona el header Authorization: Bearer <key> o X-API-Key: <key>.'
    })
  }

  const hash = hashApiKey(rawKey)
  const db = getAdminDb()

  // Search all apiKeys documents for a matching hash
  const snap = await db
    .collection('apiKeys')
    .where('hashedKey', '==', hash)
    .where('status', '==', 'active')
    .limit(1)
    .get()

  if (snap.empty) {
    throw createError({
      statusCode: 401,
      statusMessage: 'API Key inválida o revocada.'
    })
  }

  const keyDoc = snap.docs[0]!
  const userId = keyDoc.id

  // Update lastUsedAt asynchronously — do NOT await, avoids latency
  keyDoc.ref.update({ lastUsedAt: new Date() }).catch(() => {
    // fire-and-forget, non-critical
  })

  return { userId, keyDocId: keyDoc.id }
}
