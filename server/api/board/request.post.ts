/**
 * POST /api/board/request
 *
 * Creates a pending board for the authenticated user in a group.
 * Uses a transactional counter to assign unique board numbers atomically.
 *
 * This MUST be server-side because:
 * - The `_counters` collection must NOT be writable by clients
 * - runTransaction with Admin SDK guarantees atomic number assignment
 *
 * Body: { groupId: string, tournamentId: string }
 * Headers: Authorization: Bearer <Firebase ID Token>
 * Returns: { success: true, boardId: string, number: number }
 */
import { FieldValue } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const userId = user.uid

  const body = await readBody<{ groupId: string, tournamentId: string }>(event)
  const { groupId, tournamentId } = body ?? {}

  if (!groupId || !tournamentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'groupId y tournamentId son requeridos.'
    })
  }

  const db = getAdminDb()

  // Verificar que no exista ya una tabla para este usuario en este grupo
  const existingSnap = await db
    .collection('boards')
    .where('userId', '==', userId)
    .where('groupId', '==', groupId)
    .limit(1)
    .get()

  if (!existingSnap.empty) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya tienes una tabla en este grupo.'
    })
  }

  // Asignar número correlativo atómicamente usando un contador transaccional
  // por grupo. Esto elimina la race condition que existía al contar documentos
  // con .size (lectura no atómica: varios clientes podían obtener el mismo número).
  const counterRef = db.collection('_counters').doc(groupId)
  const number = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef)
    const current = (snap.data()?.['boardCount'] as number | undefined) ?? 1000
    const next = current + 1
    tx.set(counterRef, { boardCount: next }, { merge: true })
    return next
  })

  // Obtener datos del usuario y del grupo
  const [userSnap, groupSnap] = await Promise.all([
    db.collection('users').doc(userId).get(),
    db.collection('groups').doc(groupId).get()
  ])

  if (!groupSnap.exists) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Grupo no encontrado.'
    })
  }

  const userDisplayName = (userSnap.data()?.['displayName'] as string | undefined) ?? ''
  const groupName = (groupSnap.data()?.['name'] as string | undefined) ?? ''

  const boardRef = await db.collection('boards').add({
    userId,
    userDisplayName,
    groupId,
    groupName,
    tournamentId,
    number,
    isActive: false,
    totalPoints: 0,
    predsThreePoints: 0,
    predsOnePoints: 0,
    currentPos: 0,
    previousPos: 0,
    createdAt: FieldValue.serverTimestamp()
  })

  return { success: true, boardId: boardRef.id, number }
})
