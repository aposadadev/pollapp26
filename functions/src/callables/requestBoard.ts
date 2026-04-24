/**
 * requestBoard — Callable Function
 *
 * Crea una tabla pendiente para el usuario autenticado en un grupo.
 * Valida que no exista ya una tabla del usuario en ese grupo.
 *
 * Payload: { groupId: string, tournamentId: string }
 */
import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

const db = () => admin.firestore()

export const requestBoard = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.')
  }

  const userId = request.auth.uid
  const { groupId, tournamentId } = request.data as { groupId: string, tournamentId: string }

  if (!groupId || !tournamentId) {
    throw new HttpsError('invalid-argument', 'groupId y tournamentId son requeridos.')
  }

  // Verificar que no exista ya una tabla para este usuario en este grupo
  const existingSnap = await db()
    .collection('boards')
    .where('userId', '==', userId)
    .where('groupId', '==', groupId)
    .limit(1)
    .get()

  if (!existingSnap.empty) {
    throw new HttpsError('already-exists', 'Ya tienes una tabla en este grupo.')
  }

  // Asignar número correlativo atómicamente usando un contador transaccional
  // por grupo. Esto elimina la race condition que existía al contar documentos
  // con .size (lectura no atómica: varios clientes podían obtener el mismo número).
  const counterRef = db().collection('_counters').doc(groupId)
  const number = await db().runTransaction(async (tx) => {
    const snap = await tx.get(counterRef)
    const current = (snap.data()?.['boardCount'] as number | undefined) ?? 1000
    const next = current + 1
    tx.set(counterRef, { boardCount: next }, { merge: true })
    return next
  })

  // Obtener datos del usuario y del grupo
  const [userSnap, groupSnap] = await Promise.all([
    db().collection('users').doc(userId).get(),
    db().collection('groups').doc(groupId).get()
  ])

  if (!groupSnap.exists) {
    throw new HttpsError('not-found', 'Grupo no encontrado.')
  }

  const userDisplayName = (userSnap.data()?.['displayName'] as string | undefined) ?? ''
  const groupName = (groupSnap.data()?.['name'] as string | undefined) ?? ''

  const boardRef = await db().collection('boards').add({
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
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, boardId: boardRef.id, number }
})
