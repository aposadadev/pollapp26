<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const authStore = useAuthStore()

const groupsComposable = useGroups(appStore.activeTournamentId)
const groups = groupsComposable.groups
const loadingGroups = groupsComposable.loading

onMounted(async () => {
  appStore.setPageTitle('Ranking')
  await groupsComposable.loadGroups()
})

const selectedGroupId = ref<string>('')

watch(
  groups,
  (g) => {
    if (g.length && !selectedGroupId.value) {
      const activeGroup = g.find(gr => gr.userBoardIsActive) ?? g[0]
      selectedGroupId.value = activeGroup!.id
    }
  },
  { immediate: true }
)

const { entries, loading: loadingPositions, lastUpdated } = usePositions(selectedGroupId)
</script>

<template>
  <BoardPositionsView
    title="RANKING"
    subtitle="CLASIFICACIÓN"
    :entries="entries"
    :loading="loadingPositions"
    :last-updated="lastUpdated"
    :current-user-id="authStore.user?.id"
  >
    <template #top>
      <!-- Group Picker Overlapping Card -->
      <div class="stagger-up stagger-d2">
        <div
          class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[28px] p-6 lg:p-8 w-full flex flex-col gap-4"
        >
          <span class="text-[11px] font-black tracking-[0.2em] font-heading text-neutral-400 uppercase">
            Selecciona tu Liga
          </span>

          <div
            v-if="loadingGroups"
            class="flex gap-3"
          >
            <USkeleton
              v-for="i in 3"
              :key="i"
              class="h-11 w-28 rounded-full shrink-0"
            />
          </div>

          <div
            v-else-if="groups.length"
            class="overflow-x-auto pb-2 scrollbar-hide flex gap-3"
          >
            <button
              v-for="group in groups"
              :key="group.id"
              class="px-5 py-3 rounded-full text-[13px] font-bold uppercase tracking-widest transition-all whitespace-nowrap"
              :class="[
                selectedGroupId === group.id
                  ? 'bg-secondary-600 dark:bg-secondary-500 text-white shadow-md shadow-secondary-600/30'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              ]"
              @click="selectedGroupId = group.id"
            >
              {{ group.name }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </BoardPositionsView>
</template>
