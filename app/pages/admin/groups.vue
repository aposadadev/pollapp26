<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
const { getPendingBoards, activateBoard } = useAdmin()
const { groups, loading: loadingGroups, loadGroups } = useGroups(appStore.activeTournamentId)

// Per-group pending boards
const pendingBoardsByGroup = ref<Record<string, import('~/types').Board[]>>({})
const expandedGroup = ref<string | null>(null)
const loadingGroup = ref<string | null>(null)
// Track which board is currently being activated (to show per-board loading)
const activatingBoardId = ref<string | null>(null)

onMounted(async () => {
  appStore.setPageTitle('Grupos — Admin')
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
    } catch {
      // silently fail
    }
    loadingGroup.value = null
  }
}

async function handleActivate(boardId: string, groupId: string) {
  activatingBoardId.value = boardId
  try {
    const ok = await activateBoard(boardId, appStore.activeTournamentId)
    if (ok) {
      // Refresh pending list for this group
      pendingBoardsByGroup.value[groupId] = await getPendingBoards(groupId)
    }
  } finally {
    activatingBoardId.value = null
  }
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <LayoutPageHeader
      title="Gestión de Grupos"
      subtitle="Activa las tablas pendientes de aprobación para cada liga."
    />

    <div class="px-4 space-y-4">
      <div
        v-if="loadingGroups && !groups.length"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-16 rounded-2xl"
        />
      </div>

      <div
        v-else-if="!groups.length"
        class="text-center py-12 stagger-up"
      >
        <div class="size-16 bg-(--ui-bg-elevated) rounded-full flex items-center justify-center mx-auto mb-4 border border-(--ui-border)">
          <UIcon
            name="i-lucide-users"
            class="size-8 text-(--ui-text-muted)"
          />
        </div>
        <p class="font-heading text-lg font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
          No hay grupos
        </p>
        <p class="text-sm text-(--ui-text-muted)">
          No hay grupos registrados en el sistema.
        </p>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="(group, i) in groups"
          :key="group.id"
          class="card-elevated overflow-hidden stagger-up"
          :class="`stagger-d${Math.min(i + 1, 12)}`"
        >
          <!-- Cabecera del grupo -->
          <button
            class="w-full flex items-center justify-between px-5 py-4 hover:bg-(--ui-bg-muted)/50 transition-colors group"
            @click="toggleGroup(group.id)"
          >
            <div class="text-left">
              <p class="font-heading text-base font-bold text-(--ui-text-highlighted) uppercase tracking-wide group-hover:text-primary-500 transition-colors">
                {{ group.name }}
              </p>
              <p class="text-[11px] text-(--ui-text-muted) font-mono uppercase tracking-widest mt-0.5">
                Código: {{ group.code }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <UBadge
                v-if="pendingBoardsByGroup[group.id]?.length"
                color="error"
                variant="solid"
                size="sm"
                class="font-bold animate-pulse"
              >
                {{ pendingBoardsByGroup[group.id]?.length }}
              </UBadge>
              <UIcon
                :name="expandedGroup === group.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-5 text-(--ui-text-muted) group-hover:text-(--ui-text-highlighted) transition-colors"
              />
            </div>
          </button>

          <!-- Tablas pendientes -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-2 opacity-0"
          >
            <div
              v-if="expandedGroup === group.id"
              class="border-t border-(--ui-border) bg-(--ui-bg-muted)/20 px-5 py-4 space-y-3"
            >
              <div
                v-if="loadingGroup === group.id"
                class="space-y-2"
              >
                <USkeleton
                  v-for="i in 2"
                  :key="i"
                  class="h-14 rounded-xl"
                />
              </div>

              <div
                v-else-if="pendingBoardsByGroup[group.id]?.length"
                class="space-y-2"
              >
                <div
                  v-for="board in pendingBoardsByGroup[group.id]"
                  :key="board.id"
                  class="flex items-center justify-between p-3 bg-(--ui-bg) border border-(--ui-border) rounded-xl shadow-sm"
                >
                  <div class="flex items-center gap-3">
                    <div class="size-9 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                      {{ board.userDisplayName?.charAt(0).toUpperCase() || '?' }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-(--ui-text-highlighted)">
                        {{ board.userDisplayName || 'Sin nombre' }}
                      </p>
                      <p class="text-[10px] text-(--ui-text-muted) font-mono uppercase">
                        Tabla #{{ board.number }}
                      </p>
                    </div>
                  </div>
                  <UButton
                    color="secondary"
                    size="sm"
                    variant="solid"
                    icon="i-lucide-check"
                    class="font-bold"
                    :loading="activatingBoardId === board.id"
                    @click="handleActivate(board.id, group.id)"
                  >
                    Activar
                  </UButton>
                </div>
              </div>

              <div
                v-else
                class="flex flex-col items-center py-4 text-center"
              >
                <UIcon
                  name="i-lucide-circle-check"
                  class="size-8 text-secondary-500/50 mb-2"
                />
                <p class="text-xs font-medium text-(--ui-text-muted) uppercase tracking-widest">
                  No hay tablas pendientes
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
