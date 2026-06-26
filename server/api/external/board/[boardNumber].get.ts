/**
 * GET /api/external/board/:boardNumber
 *
 * Returns all visible matches for the authenticated user's board,
 * including the current prediction values for that board.
 *
 * Authentication: API Key (Authorization: Bearer <key> or X-API-Key: <key>)
 *
 * Route param: boardNumber (integer) — the board's sequential number
 * Query params:
 *   date (optional, YYYY-MM-DD) — filters matches to a specific calendar day.
 *               Comparison is done in the timezone specified by ?tz.
 *   tz   (optional, IANA tz name, default: 'America/Bogota') — timezone used to
 *               interpret the ?date parameter. Use this when the match times stored
 *               in UTC do not match the local calendar day you expect.
 *
 * Examples:
 *   GET /api/external/board/1001                                 → all matches
 *   GET /api/external/board/1001?date=2026-06-26                 → June 26 in America/Bogota (UTC-5)
 *   GET /api/external/board/1001?date=2026-06-26&tz=America/Mexico_City → June 26 in CDT
 *
 * Response per match:
 *   - id, localTeam, visitorTeam, date (ISO), phase, matchNumber, status, result
 *   - predictionsClosed: boolean — whether predictions can still be submitted
 *   - currentPrediction: { localGoalPrediction, visitorGoalPrediction } | null
 */

const PREDICTION_CUTOFF_MINUTES = 30

export default defineEventHandler(async (event) => {
  // 1. Authenticate via API key
  const { userId } = await requireApiKey(event)

  // 2. Resolve :boardNumber route param
  const boardNumberRaw = getRouterParam(event, 'boardNumber')
  const boardNumber = Number(boardNumberRaw)

  if (!boardNumberRaw || isNaN(boardNumber) || !Number.isInteger(boardNumber)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El parámetro boardNumber debe ser un número entero (ej: /api/external/board/1001).'
    })
  }

  // 3. Resolve optional ?date=YYYY-MM-DD and ?tz=IANA query params
  const query = getQuery(event)
  const dateFilter = query['date'] as string | undefined
  const tzParam = (query['tz'] as string | undefined)?.trim() || 'America/Bogota'

  // Validate timezone is a valid IANA name — Intl will throw if not
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tzParam })
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: `El parámetro tz '${tzParam}' no es una zona horaria IANA válida (ej: America/Bogota, America/Mexico_City).`
    })
  }

  if (dateFilter && !/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El parámetro date debe tener el formato YYYY-MM-DD (ej: ?date=2026-06-26).'
    })
  }

  /**
   * Returns the local calendar date of a UTC Date in the given IANA timezone
   * as a 'YYYY-MM-DD' string. Used to compare match dates in local time.
   */
  function localDateString(utcDate: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tzParam,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(utcDate)
  }

  const db = getAdminDb()

  // 4. Find the board by number + owner
  const boardsSnap = await db
    .collection('boards')
    .where('userId', '==', userId)
    .where('number', '==', boardNumber)
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (boardsSnap.empty) {
    throw createError({
      statusCode: 404,
      statusMessage: `No se encontró una tabla activa con número ${boardNumber} asociada a tu cuenta.`
    })
  }

  const boardDoc = boardsSnap.docs[0]!
  const board = boardDoc.data()
  const boardId = boardDoc.id
  const tournamentId = board['tournamentId'] as string ?? 'mundial2026'

  // 5. Fetch all matches + predictions in parallel
  const [matchesSnap, predsSnap] = await Promise.all([
    db
      .collection('matches')
      .where('tournamentId', '==', tournamentId)
      .get(),
    db
      .collection('predictions')
      .where('boardId', '==', boardId)
      .get()
  ])

  // 6. Index predictions by matchId for O(1) lookup
  const predsByMatchId = new Map<string, { local: number | null, visitor: number | null }>()
  predsSnap.docs.forEach((d) => {
    const data = d.data()
    predsByMatchId.set(data['matchId'] as string, {
      local: data['localGoalPrediction'] as number | null,
      visitor: data['visitorGoalPrediction'] as number | null
    })
  })

  // 7. Build response
  const now = new Date()

  const matches = matchesSnap.docs
    // Filter: visible only (in-memory to avoid composite index requirement)
    .filter(d => d.data()['visible'] !== false)
    .map((d) => {
      const m = d.data()
      const matchId = d.id
      const status = m['status'] as string ?? (m['isClosed'] ? 'closed' : m['isActive'] ? 'active' : 'scheduled')
      const matchDate = (m['date'] as FirebaseFirestore.Timestamp).toDate()
      const cutoff = new Date(matchDate.getTime() - PREDICTION_CUTOFF_MINUTES * 60 * 1000)
      const predictionsClosed = status === 'closed' || status === 'active' || now >= cutoff

      const pred = predsByMatchId.get(matchId) ?? null

      return {
        id: matchId,
        localTeam: {
          name: m['localTeamName'] ?? 'TBD',
          logo: m['localTeamLogo'] ?? null
        },
        visitorTeam: {
          name: m['visitorTeamName'] ?? 'TBD',
          logo: m['visitorTeamLogo'] ?? null
        },
        date: matchDate.toISOString(),
        phase: m['phase'] as string,
        matchNumber: m['matchNumber'] as number,
        status,
        result: status === 'closed'
          ? {
              localGoals: (m['localGoals'] as number ?? 0) + (m['localGoalsOT'] as number ?? 0),
              visitorGoals: (m['visitorGoals'] as number ?? 0) + (m['visitorGoalsOT'] as number ?? 0)
            }
          : null,
        predictionsClosed,
        currentPrediction: pred
          ? { localGoalPrediction: pred.local, visitorGoalPrediction: pred.visitor }
          : null,
        // Expose raw matchDate for date filtering (removed from response after filter)
        _matchDate: matchDate
      }
    })
    // Filter: optional date filter — compare in local timezone, not UTC
    .filter((m) => {
      if (!dateFilter) return true
      return localDateString(m._matchDate) === dateFilter
    })
    // Sort by match number ascending
    .sort((a, b) => a.matchNumber - b.matchNumber)
    // Remove internal _matchDate field from output
    .map(({ _matchDate: _, ...rest }) => rest)

  return {
    boardNumber,
    boardId,
    date: dateFilter ?? null,
    totalMatches: matches.length,
    matches
  }
})
