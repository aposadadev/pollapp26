/**
 * DELETE /api/api-keys
 *
 * Revokes (deletes) the authenticated user's API key.
 * After revocation, any external service using that key will receive 401 errors.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const userId = user.uid

  const db = getAdminDb()
  const docRef = db.collection('apiKeys').doc(userId)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No tienes ninguna API Key activa.'
    })
  }

  await docRef.delete()

  return { success: true, message: 'API Key revocada correctamente.' }
})
