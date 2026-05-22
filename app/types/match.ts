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
 * Retorna true si el partido está en curso (status === 'active').
 * Fallback a `match.isActive` para documentos legacy sin campo `status`.
 */
export function isMatchActive(match: Pick<Match, 'status' | 'isActive'>): boolean {
  return match.status === 'active' || (!match.status && match.isActive)
}

/**
 * Retorna true si el partido está cerrado (status === 'closed').
 * Fallback a `match.isClosed` para documentos legacy sin campo `status`.
 */
export function isMatchClosed(match: Pick<Match, 'status' | 'isClosed'>): boolean {
  return match.status === 'closed' || (!match.status && match.isClosed)
}

/**
 * Retorna true si el partido está programado (pendiente).
 * No tiene campo legacy equivalente; se basa en que no es active ni closed.
 */
export function isMatchScheduled(match: Pick<Match, 'status' | 'isActive' | 'isClosed'>): boolean {
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
