/**
 * Auth helper — Server-side token verification
 *
 * Extracts the Firebase ID Token from the Authorization header,
 * verifies it with Admin SDK, and returns the decoded user.
 *
 * Usage in API routes:
 *   const user = await requireAuth(event)
 *   // user.uid is now available
 */
import type { H3Event } from 'h3'
import type { DecodedIdToken } from 'firebase-admin/auth'

/**
 * Verifies the Firebase ID Token from the request.
 * Throws a 401 error if the token is missing or invalid.
 */
export async function requireAuth(event: H3Event): Promise<DecodedIdToken> {
  const authorization = getHeader(event, 'authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No se proporcionó token de autenticación.'
    })
  }

  const idToken = authorization.slice(7) // Remove 'Bearer '

  try {
    return await getAdminAuth().verifyIdToken(idToken)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auth] verifyIdToken failed:', message)
    throw createError({
      statusCode: 401,
      statusMessage: `Token de autenticación inválido o expirado. ${import.meta.dev ? `(${message})` : ''}`
    })
  }
}

/**
 * Verifies the Firebase ID Token and also checks for admin custom claim.
 * Throws a 403 error if the user is not an admin.
 */
export async function requireAdmin(event: H3Event): Promise<DecodedIdToken> {
  const user = await requireAuth(event)

  if (!user.admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo los administradores pueden realizar esta acción.'
    })
  }

  return user
}
