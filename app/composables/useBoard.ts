/**
 * useBoard — Composable para gestión de la tabla de predicciones
 */
import { boardService } from '~/services/board.service'
import type { Board } from '~/types'

export function useBoard() {
  const authStore = useAuthStore()
  const toast = useToast()

  const board = ref<Board | null>(null)
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

  return {
    board: readonly(board),
    loading: readonly(loading),
    loadBoard
  }
}
