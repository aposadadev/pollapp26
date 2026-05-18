/**
 * useGroups — Composable para gestión de grupos
 */
import { boardService } from '~/services/board.service'
import { parseFirebaseError } from '~/utils/firebase-error'
import type { Board } from '~/types'

export function useGroups(tournamentId: string) {
  const authStore = useAuthStore()
  const toast = useToast()

  const groups = ref<Board[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadGroups() {
    if (!authStore.user) return
    loading.value = true
    error.value = null
    try {
      const allBoards = await boardService.findByUser(authStore.user.id)
      // Sort ascending by board number to guarantee "Tabla 1", "Tabla 2", "Tabla 3" matches creation order
      groups.value = allBoards
        .filter(b => b.tournamentId === tournamentId)
        .sort((a, b) => a.number - b.number)
    } catch (err: unknown) {
      error.value = parseFirebaseError(err, 'No se pudieron cargar tus tablas.')
    } finally {
      loading.value = false
    }
  }

  const searchError = ref<string | null>(null)

  async function searchByCode(_code: string): Promise<null> {
    searchError.value = null
    return null
  }

  async function requestBoard(groupId: string, tournamentId: string): Promise<void> {
    if (!authStore.user) {
      toast.add({ title: 'Error', description: 'No hay usuario autenticado', color: 'error' })
      return
    }
    try {
      await boardService.requestBoard(authStore.user.id, tournamentId)
      toast.add({ title: 'Tabla solicitada', description: 'Espera a que un admin la active.', color: 'secondary' })
      await loadGroups()
    } catch (err: unknown) {
      toast.add({ title: 'Error al solicitar tabla', description: parseFirebaseError(err), color: 'error' })
    }
  }

  const creating = ref(false)

  async function createGroup(_name: string): Promise<null> {
    creating.value = false
    return null
  }

  return {
    groups: readonly(groups),
    loading: readonly(loading),
    error: readonly(error),
    searchError: readonly(searchError),
    creating: readonly(creating),
    loadGroups,
    searchByCode,
    requestBoard,
    createGroup
  }
}
