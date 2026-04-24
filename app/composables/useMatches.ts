/**
 * useMatches — Composable de partidos
 */
import { matchService } from '~/services/match.service'
import { parseFirebaseError } from '~/utils/firebase-error'
import type { Match } from '~/types'

export function useMatches(tournamentId: string) {
  const matches = ref<Match[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      matches.value = await matchService.findVisibleByTournament(tournamentId)
    } catch (err: unknown) {
      error.value = parseFirebaseError(err, 'No se pudieron cargar los partidos.')
    } finally {
      loading.value = false
    }
  }

  async function loadActive(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      matches.value = await matchService.findActive()
    } catch (err: unknown) {
      error.value = parseFirebaseError(err, 'No se pudieron cargar los partidos.')
    } finally {
      loading.value = false
    }
  }

  return {
    matches: readonly(matches),
    loading: readonly(loading),
    error: readonly(error),
    loadAll,
    loadActive
  }
}
