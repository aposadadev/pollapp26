/**
 * POST /api/api-keys
 *
 * Generates a new API Key for the authenticated user.
 * - If a key already exists, it is overwritten (regenerate).
 * - The plaintext key is returned ONCE in this response and never stored.
 * - Only the SHA-256 hash is persisted in Firestore.
 *
 * Body: { name?: string }
 * Returns: { plaintext: string, prefix: string, name: string, createdAt: string }
 */
import { FieldValue } from 'firebase-admin/firestore'

interface GenerateApiKeyBody {
  name?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const userId = user.uid

  const body = await readBody<GenerateApiKeyBody>(event)
  const name = body?.name?.trim() || 'Mi API Key'

  const { plaintext, hash, prefix } = generateApiKey()

  const db = getAdminDb()
  await db.collection('apiKeys').doc(userId).set({
    hashedKey: hash,
    prefix,
    name,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    lastUsedAt: null
  })

  return {
    plaintext, // ⚠️ Show this to the user ONCE — never stored in plain text again
    prefix,
    name,
    createdAt: new Date().toISOString()
  }
})
