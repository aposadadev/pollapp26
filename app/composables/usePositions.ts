/**
 * usePositions — Posiciones en tiempo real vía Realtime DB
 */
import type { MaybeRef } from 'vue'
import { rankingsRepository } from '~/repositories/rankings.repository'
import { boardRepository } from '~/repositories/board.repository'
import { rankingService } from '~/services/ranking.service'
import type { GroupRanking } from '~/types'

export function usePositions(groupId: MaybeRef<string>) {
  const authStore = useAuthStore()
  const ranking = ref<GroupRanking | null>(null)
  const loading = ref(true)
  let unsubscribe: (() => void) | null = null

  function subscribe(id: string) {
    unsubscribe?.()
    if (!id) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      unsubscribe = rankingsRepository.subscribe(
        id,
        async (data) => {
          if (data === null) {
            // El ranking no está en RTDB aún (torneo no empezado).
            // Hacemos fallback cargando los participantes desde Firestore.
            try {
              const boards = await boardRepository.findActiveByGroup(id)
              const entriesFallback = rankingService.recalculate(boards)
              ranking.value = {
                groupId: id,
                updatedAt: Date.now(),
                entries: entriesFallback
              }
            } catch (err) {
              if (import.meta.dev) {
                console.error('[usePositions] Error cargando fallback de Firestore:', err)
              }
              ranking.value = null
            }
          } else {
            ranking.value = data
          }
          loading.value = false
        },
        async (error) => {
          if (import.meta.dev) {
            console.warn('[usePositions] RTDB error callback triggered, falling back to Firestore:', error.message)
          }
          try {
            const boards = await boardRepository.findActiveByGroup(id)
            const entriesFallback = rankingService.recalculate(boards)
            ranking.value = {
              groupId: id,
              updatedAt: Date.now(),
              entries: entriesFallback
            }
          } catch {
            ranking.value = null
          }
          loading.value = false
        }
      )
    } catch (err) {
      // RTDB no configurado o bloqueado por ad blocker — falla silenciosa
      if (import.meta.dev) {
        console.warn('[usePositions] No se pudo conectar al Realtime DB:', (err as Error).message)
      }
      loading.value = false
    }
  }

  onMounted(() => {
    subscribe(toValue(groupId))
  })

  watch(
    () => toValue(groupId),
    (newId) => {
      subscribe(newId)
    }
  )

  onUnmounted(() => {
    unsubscribe?.()
  })

  const entries = computed(() => ranking.value?.entries ?? [])
  const currentUserEntry = computed(() =>
    entries.value.find(e => e.userId === authStore.user?.id) ?? null
  )
  const lastUpdated = computed(() =>
    ranking.value?.updatedAt ? new Date(ranking.value.updatedAt) : null
  )

  return {
    ranking: readonly(ranking),
    entries,
    currentUserEntry,
    lastUpdated,
    loading: readonly(loading)
  }
}
