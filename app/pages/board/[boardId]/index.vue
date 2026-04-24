<script setup lang="ts">
import { groupRepository } from '~/repositories/group.repository'

definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const groupContextStore = useGroupContextStore()

const route = useRoute()
const router = useRouter()
const boardId = computed(() => route.params.boardId as string)

const { board, loadBoard } = useBoard()
const {
  upcoming,
  previous,
  loading: predsLoading,
  saving,
  load,
  save,
  randomize
} = usePredictions(boardId)

const activeTab = ref('upcoming')
const loaded = ref(false)

onMounted(async () => {
  appStore.setPageTitle('Mi Tabla')
  const [valid] = await Promise.all([loadBoard(boardId.value), load()])
  if (!valid) {
    await router.push('/')
    return
  }
  loaded.value = true

  // Sincroniza el contexto de grupo cuando se entra por URL directa
  if (board.value && board.value.groupId) {
    // Prefer the code from the store context (already loaded), otherwise fetch it
    let groupCode = groupContextStore.activeGroupCode ?? ''
    if (!groupCode || groupContextStore.activeGroupId !== board.value.groupId) {
      try {
        const group = await groupRepository.findById(board.value.groupId)
        groupCode = group?.code ?? ''
      } catch {
        groupCode = ''
      }
    }
    groupContextStore.setContext({
      groupId: board.value.groupId,
      groupName: board.value.groupName ?? '',
      groupCode,
      boardId: boardId.value
    })
  }
})

async function handleSave(
  predictionId: string,
  local: number,
  visitor: number
) {
  await save(predictionId, local, visitor)
}

async function handleRandomize(predictionId: string) {
  const { local, visitor } = randomize(predictionId)
  await save(predictionId, local, visitor)
}
</script>

<template>
  <div
    v-if="!loaded"
    class="p-4 space-y-3"
  >
    <USkeleton class="h-20 rounded-xl" />
    <USkeleton
      v-for="i in 4"
      :key="i"
      class="h-36 rounded-xl"
    />
  </div>

  <div
    v-else
    class="relative font-sans"
  >
    <!-- Header de la tabla -->
    <BoardHeader
      v-if="board"
      :board="board"
    />

    <!-- Tabs Próximos / Anteriores -->
    <div
      class="relative z-10 -mt-[72px] px-4 sm:px-6 flex flex-col gap-6 pb-32"
    >
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 stagger-up">
        <button
          class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all duration-200 active:scale-95 whitespace-nowrap"
          :class="[
            activeTab === 'upcoming'
              ? 'border-secondary-500 bg-secondary-500 text-white shadow-lg shadow-secondary-500/20'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text-muted) hover:border-(--ui-border-muted)'
          ]"
          @click="activeTab = 'upcoming'"
        >
          <UIcon
            name="i-lucide-clock"
            class="size-4"
          />
          <span class="text-xs font-bold uppercase tracking-wider">Próximos ({{ upcoming.length }})</span>
        </button>
        <button
          class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all duration-200 active:scale-95 whitespace-nowrap"
          :class="[
            activeTab === 'previous'
              ? 'border-secondary-500 bg-secondary-500 text-white shadow-lg shadow-secondary-500/20'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text-muted) hover:border-(--ui-border-muted)'
          ]"
          @click="activeTab = 'previous'"
        >
          <UIcon
            name="i-lucide-history"
            class="size-4"
          />
          <span class="text-xs font-bold uppercase tracking-wider">Anteriores ({{ previous.length }})</span>
        </button>
      </div>

      <Transition
        name="fade"
        mode="out-in"
      >
        <div
          :key="activeTab"
          class="space-y-4"
        >
          <!-- Tab Próximos -->
          <div
            v-if="activeTab === 'upcoming'"
            class="space-y-4"
          >
            <div
              v-if="predsLoading"
              class="space-y-4"
            >
              <USkeleton
                v-for="i in 3"
                :key="i"
                class="h-44 rounded-xl"
              />
            </div>

            <div
              v-for="(pred, i) in upcoming"
              :key="pred.id"
              class="stagger-up"
              :class="`stagger-d${Math.min(i + 1, 12)}`"
            >
              <MatchCard
                :prediction="pred"
                :saving="saving === pred.id"
                @save="handleSave"
                @randomize="handleRandomize"
              />
            </div>

            <div
              v-if="!predsLoading && !upcoming.length"
              class="text-center py-12 stagger-up flex flex-col items-center justify-center bg-(--ui-bg-elevated) border border-(--ui-border) border-dashed rounded-[24px]"
            >
              <UIcon
                name="i-lucide-circle-check"
                class="size-16 text-secondary-500 mx-auto mb-4"
              />
              <p class="text-h2 text-(--ui-text-highlighted)">
                ¡Todo al día!
              </p>
              <p
                class="text-sm font-medium text-neutral-400 mt-2 uppercase tracking-widest"
              >
                No hay partidos próximos pendientes.
              </p>
            </div>
          </div>

          <!-- Tab Anteriores -->
          <div
            v-else-if="activeTab === 'previous'"
            class="space-y-4"
          >
            <div
              v-for="(pred, i) in previous"
              :key="pred.id"
              class="stagger-up"
              :class="`stagger-d${Math.min(i + 1, 12)}`"
            >
              <MatchCard
                :prediction="pred"
                :is-readonly="true"
                :board-id="boardId"
                @save="handleSave"
                @randomize="handleRandomize"
              />
            </div>

            <div
              v-if="!predsLoading && !previous.length"
              class="text-center py-12 stagger-up flex flex-col items-center justify-center bg-(--ui-bg-elevated) border border-(--ui-border) border-dashed rounded-[24px]"
            >
              <UIcon
                name="i-lucide-hourglass"
                class="size-16 text-(--ui-text-muted) mx-auto mb-4"
              />
              <p
                class="text-sm font-medium text-neutral-400 mt-2 uppercase tracking-widest"
              >
                Aún no hay partidos jugados.
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
