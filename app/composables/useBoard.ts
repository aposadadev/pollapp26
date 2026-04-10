/**
 * useBoard — Composable para gestión de la tabla de predicciones
 */
import { boardService } from '~/services/board.service'
import type { Board } from '~/types'

export function useBoard() {
  const authStore = useAuthStore()
  const toast = useToast()

  const board = ref<Board | null>(null)
  const userBoards = ref<Board[]>([])
  const loading = ref(false)

  async function loadBoard(boardId: string): Promise<boolean> {
    if (!authStore.user) return false
    loading.value = true
    try {
      board.value = await boardService.validateOwnership(boardId, authStore.user.id)
      return true
    } catch (err: unknown) {
      toast.add({ title: 'Acceso denegado', description: (err as Error).message, color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  async function loadUserBoards(): Promise<void> {
    if (!authStore.user) return
    loading.value = true
    try {
      userBoards.value = await boardService.findByUser(authStore.user.id)
    } finally {
      loading.value = false
    }
  }

  async function requestBoard(groupId: string, tournamentId: string): Promise<Board | null> {
    if (!authStore.user) return null
    loading.value = true
    try {
      const newBoard = await boardService.requestBoard(authStore.user.id, groupId, tournamentId)
      toast.add({
        title: 'Tabla solicitada',
        description: 'Tu solicitud está pendiente de activación por el administrador.',
        color: 'secondary'
      })
      return newBoard
    } catch (err: unknown) {
      toast.add({ title: 'Error', description: (err as Error).message, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    board: readonly(board),
    userBoards: readonly(userBoards),
    loading: readonly(loading),
    loadBoard,
    loadUserBoards,
    requestBoard
  }
}
