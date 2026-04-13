<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
const authStore = useAuthStore()

console.log('Admin page - user:', authStore.user)
console.log('Admin page - isAdmin:', authStore.isAdmin)

onMounted(() => {
  appStore.setPageTitle('Grupos — Admin')
  console.log('Admin page mounted')
})

const { loading, getPendingBoards, activateBoard } = useAdmin()
const { groups, loadGroups } = useGroups(mundial2026.id)

// Per-group pending boards
const pendingBoardsByGroup = ref<Record<string, import('~/types').Board[]>>({})
const expandedGroup = ref<string | null>(null)
const loadingGroup = ref<string | null>(null)

onMounted(async () => {
  await loadGroups()
})

async function toggleGroup(groupId: string) {
  if (expandedGroup.value === groupId) {
    expandedGroup.value = null
    return
  }
  expandedGroup.value = groupId
  if (!pendingBoardsByGroup.value[groupId]) {
    loadingGroup.value = groupId
    try {
      pendingBoardsByGroup.value[groupId] = await getPendingBoards(groupId)
      console.log('Pending boards for group', groupId, ':', pendingBoardsByGroup.value[groupId])
    } catch (err) {
      console.error('Error getting pending boards:', err)
    }
    loadingGroup.value = null
  }
}

async function handleActivate(boardId: string, groupId: string) {
  console.log('Activating board:', boardId, groupId)
  const ok = await activateBoard(boardId, mundial2026.id)
  console.log('Activate result:', ok)
  if (ok) {
    // Refresh pending list for this group
    pendingBoardsByGroup.value[groupId] = await getPendingBoards(groupId)
  }
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-lg font-bold text-(--ui-text-highlighted)">
        Grupos
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        Activa las tablas pendientes de aprobación.
      </p>
    </div>

    <div
      v-if="loading && !groups.length"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 4"
        :key="i"
        class="h-16 rounded-xl"
      />
    </div>

    <div
      v-else-if="!groups.length"
      class="text-center py-10"
    >
      <UIcon
        name="i-lucide-users"
        class="size-10 text-(--ui-text-muted) mx-auto mb-2"
      />
      <p class="text-sm text-(--ui-text-muted)">
        No hay grupos registrados.
      </p>
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="group in groups"
        :key="group.id"
        class="bg-(--ui-bg) border border-(--ui-border) rounded-xl overflow-hidden"
      >
        <!-- Cabecera del grupo -->
        <button
          class="w-full flex items-center justify-between px-4 py-3 hover:bg-(--ui-bg-elevated) transition-colors"
          @click="toggleGroup(group.id)"
        >
          <div class="text-left">
            <p class="text-sm font-semibold text-(--ui-text-highlighted)">
              {{ group.name }}
            </p>
            <p class="text-xs text-(--ui-text-muted) font-mono">
              {{ group.code }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <UBadge
              v-if="pendingBoardsByGroup[group.id]?.length"
              color="error"
              variant="solid"
              size="sm"
            >
              {{ pendingBoardsByGroup[group.id]?.length }} pendiente(s)
            </UBadge>
            <UIcon
              :name="expandedGroup === group.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="size-4 text-(--ui-text-muted)"
            />
          </div>
        </button>

        <!-- Tablas pendientes -->
        <div
          v-if="expandedGroup === group.id"
          class="border-t border-(--ui-border) px-4 py-3 space-y-2"
        >
          <div
            v-if="loadingGroup === group.id"
            class="space-y-2"
          >
            <USkeleton
              v-for="i in 2"
              :key="i"
              class="h-12 rounded-lg"
            />
          </div>

          <div
            v-else-if="pendingBoardsByGroup[group.id]?.length"
          >
            <div
              v-for="board in pendingBoardsByGroup[group.id]"
              :key="board.id"
              class="flex items-center justify-between py-2 border-b border-(--ui-border) last:border-0"
            >
              <div>
                <p class="text-sm font-medium text-(--ui-text-highlighted)">
                  {{ board.userDisplayName || 'Sin nombre' }}
                </p>
                <p class="text-xs text-(--ui-text-muted)">
                  Tabla #{{ board.number }}
                </p>
              </div>
              <UButton
                color="secondary"
                size="xs"
                icon="i-lucide-check"
                :loading="loading"
                @click="handleActivate(board.id, group.id)"
              >
                Activar
              </UButton>
            </div>
          </div>

          <p
            v-else
            class="text-xs text-(--ui-text-muted) text-center py-2"
          >
            No hay tablas pendientes en este grupo.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
