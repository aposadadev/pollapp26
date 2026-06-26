/**
 * GET /api/api-keys
 *
 * Returns the metadata of the authenticated user's API key, if it exists.
 * Never returns the hashed key — only safe display fields.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const userId = user.uid

  const db = getAdminDb()
  const docSnap = await db.collection('apiKeys').doc(userId).get()

  if (!docSnap.exists) {
    return { exists: false, key: null }
  }

  const data = docSnap.data()!
  return {
    exists: true,
    key: {
      prefix: data['prefix'] as string,
      name: data['name'] as string,
      status: data['status'] as string,
      createdAt: (data['createdAt'] as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
      lastUsedAt: (data['lastUsedAt'] as FirebaseFirestore.Timestamp | undefined)?.toDate?.()?.toISOString() ?? null
    }
  }
})
