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
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function clearOrSetEmpty(id: string) {
    ranking.value = {
      groupId: id,
      updatedAt: Date.now(),
      entries: []
    }
    loading.value = false
  }

  function subscribe(id: string) {
    unsubscribe?.()
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (!id) {
      loading.value = false
      return
    }
    loading.value = true

    // Si RTDB no responde en 2.5 segundos, asumimos vacío/cargando lento
    timeoutId = setTimeout(() => {
      if (loading.value) {
        if (import.meta.dev) {
          console.warn('[usePositions] RTDB connection timed out. Setting empty ranking.')
        }
        clearOrSetEmpty(id)
      }
    }, 2500)

    try {
      unsubscribe = rankingsRepository.subscribe(
        id,
        (data) => {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          if (data === null) {
            // El ranking no está en RTDB aún (torneo no empezado).
            clearOrSetEmpty(id)
          } else {
            ranking.value = data
            loading.value = false
          }
        },
        (error) => {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          if (import.meta.dev) {
            console.warn('[usePositions] RTDB error callback triggered, setting empty ranking:', error.message)
          }
          clearOrSetEmpty(id)
        }
      )
    } catch (err) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      // RTDB no configurado o bloqueado por ad blocker — falla silenciosa
      if (import.meta.dev) {
        console.warn('[usePositions] No se pudo conectar al Realtime DB:', (err as Error).message)
      }
      clearOrSetEmpty(id)
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
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
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
