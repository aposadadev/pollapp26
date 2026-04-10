/**
 * createGroup — Callable Function
 *
 * Crea un nuevo grupo para el torneo con un código único de 6 caracteres.
 * El usuario que lo crea se convierte en propietario.
 *
 * Payload: { name: string, tournamentId: string }
 */
import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'

const db = () => admin.firestore()

/** Genera un código alfanumérico de 6 caracteres (mayúsculas + números) */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin O, I, 0, 1 para evitar confusión
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/** Genera un código único verificando colisiones en Firestore */
async function generateUniqueCode(): Promise<string> {
  let attempts = 0
  while (attempts < 10) {
    const code = generateCode()
    const snap = await db()
      .collection('groups')
      .where('code', '==', code)
      .limit(1)
      .get()
    if (snap.empty) return code
    attempts++
  }
  throw new Error('No se pudo generar un código único. Intenta de nuevo.')
}

export const createGroup = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.')
  }

  const userId = request.auth.uid
  const { name, tournamentId } = request.data as { name: string, tournamentId: string }

  if (!name?.trim() || !tournamentId) {
    throw new HttpsError('invalid-argument', 'name y tournamentId son requeridos.')
  }

  if (name.trim().length < 3 || name.trim().length > 50) {
    throw new HttpsError('invalid-argument', 'El nombre del grupo debe tener entre 3 y 50 caracteres.')
  }

  // Obtener nombre del propietario
  const userSnap = await db().collection('users').doc(userId).get()
  const ownerName = (userSnap.data()?.['displayName'] as string | undefined) ?? ''

  const code = await generateUniqueCode()

  const groupRef = await db().collection('groups').add({
    name: name.trim(),
    code,
    ownerId: userId,
    ownerName,
    tournamentId,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  return { success: true, groupId: groupRef.id, code }
})
