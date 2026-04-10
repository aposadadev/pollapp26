/**
 * usePositions — Posiciones en tiempo real vía Realtime DB
 */
import type { MaybeRef } from 'vue'
import { rankingsRepository } from '~/repositories/rankings.repository'
import type { GroupRanking } from '~/types'

export function usePositions(groupId: MaybeRef<string>) {
  const authStore = useAuthStore()
  const ranking = ref<GroupRanking | null>(null)
  const loading = ref(true)
  let unsubscribe: (() => void) | null = null

  function subscribe(id: string) {
    unsubscribe?.()
    if (!id) return
    loading.value = true
    try {
      unsubscribe = rankingsRepository.subscribe(id, (data) => {
        ranking.value = data
        loading.value = false
      })
    } catch (err) {
      // RTDB no configurado o bloqueado por ad blocker — falla silenciosa
      console.warn('[usePositions] No se pudo conectar al Realtime DB:', (err as Error).message)
      loading.value = false
    }
  }

  onMounted(() => {
    subscribe(toValue(groupId))
  })

  watch(
    () => toValue(groupId),
    (newId) => {
      if (newId) subscribe(newId)
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
