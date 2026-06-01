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
import { sendToTokens } from '../../utils/notifications/sender'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const userId = user.uid

  const body = await readBody<{ tournamentId: string }>(event)
  const { tournamentId } = body ?? {}

  if (!tournamentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'tournamentId es requerido.'
    })
  }

  const groupId = 'global-group'
  const db = getAdminDb()

  // Asegurar que el grupo global exista
  let groupSnap = await db.collection('groups').doc(groupId).get()
  if (!groupSnap.exists) {
    await db.collection('groups').doc(groupId).set({
      name: 'Polla Mundial 2026',
      code: 'GLOBAL',
      ownerId: 'admin',
      ownerName: 'Sistema',
      tournamentId,
      isActive: true,
      createdAt: FieldValue.serverTimestamp()
    })
    groupSnap = await db.collection('groups').doc(groupId).get()
  }

  // Verificar que no tenga ya 3 tablas en este grupo global
  const existingSnap = await db
    .collection('boards')
    .where('userId', '==', userId)
    .where('groupId', '==', groupId)
    .get()

  if (existingSnap.size >= 3) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ya has alcanzado el límite máximo de 3 tablas.'
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
  const userSnap = await db.collection('users').doc(userId).get()

  const userDisplayName = (userSnap.data()?.['displayName'] as string | undefined) ?? ''
  const userPhotoURL = (userSnap.data()?.['photoURL'] as string | undefined) ?? ''
  const groupName = (groupSnap.data()?.['name'] as string | undefined) ?? ''

  const boardRef = await db.collection('boards').add({
    userId,
    userDisplayName,
    userPhotoURL,
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

  // Enviar notificación push a administradores globales
  try {
    const adminsSnap = await db.collection('users').where('isAdmin', '==', true).get()
    const adminTokens: string[] = []
    const adminUserIds: string[] = []

    adminsSnap.forEach((doc) => {
      const data = doc.data()
      const tokens = data['fcmTokens'] as string[] | undefined
      if (tokens && tokens.length > 0) {
        tokens.forEach((t) => {
          adminTokens.push(t)
          adminUserIds.push(doc.id)
        })
      }
    })

    if (adminTokens.length > 0) {
      const payload = {
        notification: {
          title: '🚨 Nueva Tabla Solicitada',
          body: `${userDisplayName || 'Un usuario'} solicitó una tabla. Entra a revisar y aprobar.`
        },
        data: {
          url: '/admin/groups',
          tag: `board-request-${boardRef.id}`,
          type: 'match_reminder' as const
        }
      }
      await sendToTokens(adminTokens, payload, adminUserIds)
    }
  } catch (err) {
    console.error('[FCM] Error sending new board request notification to admins:', err)
  }

  return { success: true, boardId: boardRef.id, number }
})
