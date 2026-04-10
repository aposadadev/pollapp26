/**
 * useGroups — Composable para gestión de grupos
 */
import { groupService } from '~/services/group.service'
import { boardService } from '~/services/board.service'
import type { Group, GroupWithBoardStatus } from '~/types'

export function useGroups(tournamentId: string) {
  const authStore = useAuthStore()
  const toast = useToast()

  const groups = ref<GroupWithBoardStatus[]>([])
  const allGroups = ref<Group[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadGroups() {
    if (!authStore.user) return
    loading.value = true
    error.value = null
    try {
      groups.value = await groupService.findForUser(tournamentId, authStore.user.id)
    } catch (err: unknown) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  async function loadAllGroups() {
    loading.value = true
    try {
      allGroups.value = await groupService.findAll()
    } finally {
      loading.value = false
    }
  }

  async function searchByCode(code: string): Promise<Group | null> {
    try {
      return await groupService.findByCode(code)
    } catch {
      return null
    }
  }

  async function createGroup(name: string): Promise<Group | null> {
    if (!authStore.user) return null
    loading.value = true
    try {
      const group = await groupService.createGroup(
        name,
        authStore.user.id,
        authStore.user.displayName,
        tournamentId
      )
      toast.add({ title: 'Grupo creado', description: `Código: ${group.code}`, color: 'secondary' })
      await loadAllGroups()
      return group
    } catch (err: unknown) {
      toast.add({ title: 'Error al crear grupo', description: (err as Error).message, color: 'error' })
      return null
    } finally {
      loading.value = false
    }
  }

  async function requestBoard(groupId: string, tournamentId: string): Promise<void> {
    if (!authStore.user) {
      alert('No hay usuario autenticado')
      return
    }
    try {
      console.log('Calling boardService.requestBoard...')
      await boardService.requestBoard(authStore.user.id, groupId, tournamentId)
      console.log('Board created!')
      toast.add({ title: 'Tabla solicitada', description: 'Espera a que un admin la active.', color: 'secondary' })
      await loadGroups()
    } catch (err: unknown) {
      console.error('Error requestBoard:', err)
      const message = err instanceof Error ? err.message : String(err)
      console.log('Error message:', message)
      alert('Error: ' + message)
      toast.add({ title: 'Error al solicitar tabla', description: message, color: 'error' })
    }
  }

  return {
    groups: readonly(groups),
    allGroups: readonly(allGroups),
    loading: readonly(loading),
    error: readonly(error),
    loadGroups,
    loadAllGroups,
    searchByCode,
    createGroup,
    requestBoard
  }
}
