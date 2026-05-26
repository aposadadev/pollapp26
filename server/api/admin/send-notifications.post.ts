/**
 * POST /api/admin/send-notifications
 *
 * Sends push notifications to specified targets. Protected for global admins.
 *
 * Body: {
 *   target: 'all' | 'group' | 'users' | 'missing-predictions',
 *   groupId?: string,
 *   userIds?: string[],
 *   title: string,
 *   body: string,
 *   url?: string
 * }
 */
import { sendToTokens } from '../../utils/notifications/sender'

export default defineEventHandler(async (event) => {
  // Validar rol de administrador
  await requireAdmin(event)

  const requestBody = await readBody<{
    target: 'all' | 'group' | 'users' | 'missing-predictions'
    groupId?: string
    userIds?: string[]
    title: string
    body: string
    url?: string
  }>(event)

  const { target, groupId, userIds, title, body, url = '/' } = requestBody ?? {}

  if (!title || !body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El título y cuerpo de la notificación son obligatorios.'
    })
  }

  const db = getAdminDb()
  const tokens: string[] = []
  const tokenUserIds: string[] = []

  // Función helper para recolectar tokens de un conjunto de IDs de usuario
  async function collectTokensForUsers(uIds: string[]) {
    if (uIds.length === 0) return

    // Chunk en lotes de 30 para evitar limitaciones de Firestore 'in'
    const chunks: string[][] = []
    for (let i = 0; i < uIds.length; i += 30) {
      chunks.push(uIds.slice(i, i + 30))
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        const snap = await db.collection('users').where('__name__', 'in', chunk).get()
        snap.forEach((doc) => {
          const data = doc.data()
          const docTokens = data['fcmTokens'] as string[] | undefined
          if (docTokens && docTokens.length > 0) {
            docTokens.forEach((t) => {
              tokens.push(t)
              tokenUserIds.push(doc.id)
            })
          }
        })
      })
    )
  }

  if (target === 'all') {
    // Obtener todos los usuarios del sistema
    const usersSnap = await db.collection('users').get()
    usersSnap.forEach((doc) => {
      const data = doc.data()
      const docTokens = data['fcmTokens'] as string[] | undefined
      if (docTokens && docTokens.length > 0) {
        docTokens.forEach((t) => {
          tokens.push(t)
          tokenUserIds.push(doc.id)
        })
      }
    })
  } else if (target === 'group') {
    if (!groupId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'groupId es requerido para el objetivo "group".'
      })
    }
    // Obtener todos los boards en el grupo
    const boardsSnap = await db.collection('boards').where('groupId', '==', groupId).get()
    const groupUserIds = [...new Set(boardsSnap.docs.map(doc => doc.data()['userId'] as string).filter(Boolean))]
    await collectTokensForUsers(groupUserIds)
  } else if (target === 'users') {
    if (!userIds || userIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'userIds es requerido para el objetivo "users".'
      })
    }
    await collectTokensForUsers(userIds)
  } else if (target === 'missing-predictions') {
    // 1. Obtener partidos programados para hoy
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const matchesSnap = await db.collection('matches')
      .where('status', '==', 'scheduled')
      .get()

    const todayMatchIds: string[] = []
    matchesSnap.forEach((doc) => {
      const matchData = doc.data()
      const matchDate = (matchData['date'] as { toDate?: () => Date })?.toDate?.() ?? new Date()
      if (matchDate >= startOfDay && matchDate <= endOfDay) {
        todayMatchIds.push(doc.id)
      }
    })

    if (todayMatchIds.length === 0) {
      return { success: true, sent: 0, failed: 0, message: 'No hay partidos programados para hoy.' }
    }

    // 2. Obtener todas las tablas activas
    const boardsSnap = await db.collection('boards').where('isActive', '==', true).get()
    if (boardsSnap.empty) {
      return { success: true, sent: 0, failed: 0, message: 'No hay tablas activas en el sistema.' }
    }

    // 3. Obtener predicciones para hoy
    // Nota: 'in' de firestore admite máximo 30 elementos.
    // Durante un mundial no habrá más de 30 partidos en un solo día (máximo 4 partidos).
    const predsSnap = await db.collection('predictions')
      .where('matchId', 'in', todayMatchIds)
      .get()

    const boardMatchPredictions = new Map<string, Set<string>>()
    predsSnap.forEach((doc) => {
      const p = doc.data()
      if (p['localGoalPrediction'] !== null && p['visitorGoalPrediction'] !== null) {
        const boardId = p['boardId'] as string
        const matchId = p['matchId'] as string
        if (!boardMatchPredictions.has(boardId)) {
          boardMatchPredictions.set(boardId, new Set())
        }
        boardMatchPredictions.get(boardId)!.add(matchId)
      }
    })

    // 4. Filtrar usuarios con tablas activas que falten por pronosticar
    const missingUserIds = new Set<string>()
    boardsSnap.forEach((doc) => {
      const board = doc.data()
      const boardId = doc.id
      const userId = board['userId'] as string
      const predictedMatches = boardMatchPredictions.get(boardId) ?? new Set()

      const isMissing = todayMatchIds.some(mId => !predictedMatches.has(mId))
      if (isMissing && userId) {
        missingUserIds.add(userId)
      }
    })

    await collectTokensForUsers([...missingUserIds])
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'El objetivo (target) no es válido.'
    })
  }

  if (tokens.length === 0) {
    return { success: true, sent: 0, failed: 0, message: 'No se encontraron destinatarios con tokens push.' }
  }

  // Realizar el envío
  const payload = {
    notification: { title, body },
    data: {
      url,
      tag: `custom-${Date.now()}`,
      type: 'match_reminder' as const
    }
  }

  const { sent, failed } = await sendToTokens(tokens, payload, tokenUserIds)
  return { success: true, sent, failed }
})
