/**
 * useGroups — Composable para gestión de grupos
 */
import { groupService } from '~/services/group.service'
import { boardService } from '~/services/board.service'
import { parseFirebaseError } from '~/utils/firebase-error'
import type { Group, GroupWithBoardStatus } from '~/types'

export function useGroups(tournamentId: string) {
  const authStore = useAuthStore()
  const toast = useToast()

  const groups = ref<GroupWithBoardStatus[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadGroups() {
    if (!authStore.user) return
    loading.value = true
    error.value = null
    try {
      groups.value = await groupService.findForUser(tournamentId, authStore.user.id)
    } catch (err: unknown) {
      error.value = parseFirebaseError(err, 'No se pudieron cargar tus ligas.')
    } finally {
      loading.value = false
    }
  }

  const searchError = ref<string | null>(null)

  async function searchByCode(code: string): Promise<Group | null> {
    searchError.value = null
    try {
      const group = await groupService.findByCode(code)
      if (!group) {
        searchError.value = 'No se encontró ninguna liga con ese código.'
      }
      return group
    } catch (err: unknown) {
      searchError.value = parseFirebaseError(err, 'Error al buscar la liga. Intenta más tarde.')
      return null
    }
  }

  async function requestBoard(groupId: string, tournamentId: string): Promise<void> {
    if (!authStore.user) {
      toast.add({ title: 'Error', description: 'No hay usuario autenticado', color: 'error' })
      return
    }
    try {
      await boardService.requestBoard(authStore.user.id, groupId, tournamentId)
      toast.add({ title: 'Tabla solicitada', description: 'Espera a que un admin la active.', color: 'secondary' })
      await loadGroups()
    } catch (err: unknown) {
      toast.add({ title: 'Error al solicitar tabla', description: parseFirebaseError(err), color: 'error' })
    }
  }

  const creating = ref(false)

  async function createGroup(name: string): Promise<Group | null> {
    if (!authStore.user) {
      toast.add({ title: 'Error', description: 'No hay usuario autenticado', color: 'error' })
      return null
    }
    creating.value = true
    try {
      const group = await groupService.createGroup(
        name,
        authStore.user.id,
        authStore.user.displayName ?? authStore.user.email,
        tournamentId
      )
      toast.add({ title: '¡Liga creada!', description: `Código: ${group.code}`, color: 'secondary' })
      await loadGroups()
      return group
    } catch (err: unknown) {
      toast.add({ title: 'Error al crear liga', description: parseFirebaseError(err), color: 'error' })
      return null
    } finally {
      creating.value = false
    }
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
