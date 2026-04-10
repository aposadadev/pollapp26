<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'

definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const authStore = useAuthStore()

onMounted(() => appStore.setPageTitle('Ranking'))

const groupsComposable = useGroups(mundial2026.id)
const groups = groupsComposable.groups
const loadingGroups = groupsComposable.loading

onMounted(async () => {
  await groupsComposable.loadGroups()
})

const selectedGroupId = ref<string>('')

watch(
  groups,
  (g) => {
    if (g.length && !selectedGroupId.value) {
      const activeGroup = g.find(gr => gr.userBoardIsActive) ?? g[0]
      selectedGroupId.value = activeGroup.id
    }
  },
  { immediate: true }
)

const positionsComposable = usePositions(selectedGroupId)
const entries = positionsComposable.entries
const currentUserEntry = positionsComposable.currentUserEntry
const loadingPositions = positionsComposable.loading
const lastUpdated = positionsComposable.lastUpdated

const formattedUpdate = computed(() =>
  lastUpdated.value
    ? new Intl.DateTimeFormat('es', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(lastUpdated.value)
    : null
)
</script>

<template>
  <div class="page-content bg-(--ui-bg) min-h-screen relative font-sans">
    <LayoutPageHeader
      title="RANKING"
      subtitle="CLASIFICACIÓN"
    >
      <template #actions>
        <div
          v-if="formattedUpdate"
          class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md"
        >
          <span
            class="size-1.5 rounded-full bg-[var(--ui-color-green-400)] animate-pulse"
          />
          <span
            class="text-[9px] font-bold text-white uppercase tracking-widest"
          >EN VIVO {{ formattedUpdate }}</span>
        </div>
      </template>
    </LayoutPageHeader>

    <div class="relative z-10 -mt-16 px-4 sm:px-6 flex flex-col gap-8 pb-32">
      <!-- Group Picker Overlapping Card -->
      <div class="stagger-up stagger-d2">
        <div
          class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[28px] p-6 lg:p-8 w-full flex flex-col gap-4"
        >
          <span
            class="text-[11px] font-black tracking-[0.2em] font-heading text-neutral-400 uppercase"
          >Selecciona tu Liga</span>

          <div
            v-if="groups.length"
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

      <!-- Podium Section -->
      <div
        v-if="!loadingPositions && entries.length >= 3"
        class="-mx-2 stagger-up stagger-d4"
      >
        <BoardPodiumLayout :entries="entries" />
      </div>

      <!-- Full Standings List -->
      <div class="flex flex-col gap-4 stagger-up stagger-d5 mt-4">
        <h3
          class="text-[14px] font-black text-neutral-500 dark:text-neutral-400 tracking-widest font-heading px-2 mb-2"
        >
          TABLA COMPLETA
        </h3>

        <div
          v-if="loadingPositions"
          class="space-y-4 px-2"
        >
          <USkeleton
            v-for="i in 5"
            :key="i"
            class="h-20 rounded-[20px] w-full"
          />
        </div>

        <template v-else-if="entries.length">
          <!-- Table Component inside the consistent structure -->
          <BoardPositionsTable
            :entries="entries"
            :current-user-id="authStore.user?.id"
          />
        </template>

        <div
          v-else-if="!loadingGroups"
          class="w-full flex flex-col items-center justify-center p-12 bg-(--ui-bg-elevated) rounded-[24px] border border-(--ui-border) border-dashed"
        >
          <UIcon
            name="i-lucide-trophy"
            class="size-16 mx-auto mb-4 text-neutral-300"
          />
          <span
            class="text-sm font-bold text-neutral-400 uppercase tracking-widest"
          >No hay registros aún</span>
        </div>
      </div>
    </div>
  </div>
</template>
