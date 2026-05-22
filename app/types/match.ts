export type MatchPhase
  = | 'Fase de Grupos'
    | 'Dieciseisavos de Final'
    | 'Octavos de Final'
    | 'Cuartos de Final'
    | 'Semifinales'
    | 'Tercer Lugar'
    | 'Final'

export type MatchStatus = 'scheduled' | 'active' | 'closed'

export interface Match {
  id: string
  tournamentId: string
  localTeamId: string
  visitorTeamId: string
  localTeamName?: string
  visitorTeamName?: string
  localTeamLogo?: string
  visitorTeamLogo?: string
  localGoals: number | null
  visitorGoals: number | null
  date: Date
  phase: MatchPhase
  matchNumber: number
  /**
   * Fuente de verdad del estado del partido.
   * - 'scheduled': partido pendiente, predicciones abiertas
   * - 'active': partido en curso (EN VIVO)
   * - 'closed': partido cerrado, puntos calculados
   */
  status: MatchStatus
  stadium?: string
  /**
   * @deprecated Derivar de `status === 'active'`.
   * Se mantiene para compatibilidad con componentes existentes hasta migración.
   * Bloqueante: ~15 archivos usan este campo; migrar en PR posterior dedicado.
   */
  isActive: boolean
  /**
   * @deprecated Derivar de `status === 'closed'`.
   * Se mantiene para compatibilidad con componentes existentes hasta migración.
   * Bloqueante: ~15 archivos usan este campo; migrar en PR posterior dedicado.
   */
  isClosed: boolean
  createdAt: Date
  /**
   * Controla si el partido es visible para usuarios finales.
   * Un partido puede existir en Firestore pero estar oculto hasta que el admin
   * lo publique (e.g., partidos de eliminatorias con equipos aún sin definir).
   * - `true` o `undefined` (legacy) → visible para usuarios
   * - `false` → oculto para usuarios; solo admin puede verlo
   */
  visible?: boolean
  localGoalsOT?: number | null
  visitorGoalsOT?: number | null
  localPenalties?: number | null
  visitorPenalties?: number | null
}

export interface MatchWithTeams extends Match {
  localTeam: { id: string, name: string, shortName: string, logoUrl: string }
  visitorTeam: { id: string, name: string, shortName: string, logoUrl: string }
}

// ─── Domain helpers ───────────────────────────────────────────────────────────
// Usar siempre estos helpers en lugar de comparar directamente `match.isActive`
// o `match.isClosed`. Priorizan `status` como fuente de verdad y tienen fallback
// a los campos legacy para datos sin `status` en Firestore.

/**
 * Retorna true si el partido está en curso o ya llegó la hora de inicio.
 * Un partido está activo si su status es 'active', o si no está cerrado y ya llegó su hora de inicio.
 */
export function isMatchActive(match: { status?: string | null, isActive?: boolean, date: Date | string, isClosed?: boolean }): boolean {
  if (isMatchClosed(match)) return false
  const now = new Date()
  const matchDate = match.date instanceof Date ? match.date : new Date(match.date)
  return match.status === 'active' || (!match.status && !!match.isActive) || now >= matchDate
}

/**
 * Retorna true si el partido está cerrado (status === 'closed').
 * Fallback a `match.isClosed` para documentos legacy sin campo `status`.
 */
export function isMatchClosed(match: { status?: string | null, isClosed?: boolean }): boolean {
  return match.status === 'closed' || (!match.status && !!match.isClosed)
}

/**
 * Retorna true si el partido está programado (pendiente, no ha comenzado).
 */
export function isMatchScheduled(match: { status?: string | null, isActive?: boolean, date: Date | string, isClosed?: boolean }): boolean {
  return !isMatchActive(match) && !isMatchClosed(match)
}

/**
 * Retorna true si el partido es visible para usuarios finales.
 * Fallback seguro: si el campo `visible` no existe en el documento (legacy),
 * se considera visible=true para no romper partidos existentes.
 */
export function isMatchVisible(match: Pick<Match, 'visible'>): boolean {
  return match.visible !== false
}
