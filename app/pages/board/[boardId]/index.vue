<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const groupContextStore = useGroupContextStore()
onMounted(() => appStore.setPageTitle('Mi Tabla'))

const route = useRoute()
const router = useRouter()
const boardId = computed(() => route.params.boardId as string)

const { board, loading: boardLoading, loadBoard } = useBoard()
const {
  upcoming,
  previous,
  loading: predsLoading,
  saving,
  load,
  save,
  randomize
} = usePredictions(boardId.value)

const activeTab = ref('upcoming')
const loaded = ref(false)

onMounted(async () => {
  const [valid] = await Promise.all([loadBoard(boardId.value), load()])
  if (!valid) {
    await router.push('/')
    return
  }
  loaded.value = true

  // Sincroniza el contexto de grupo cuando se entra por URL directa
  if (board.value && board.value.groupId) {
    groupContextStore.setContext({
      groupId: board.value.groupId,
      groupName: board.value.groupName ?? '',
      groupCode: groupContextStore.activeGroupCode ?? '',
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

function handleRandomize(predictionId: string) {
  randomize(predictionId)
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
    class="min-h-screen bg-(--ui-bg) page-content relative font-sans"
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
      <div
        class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[24px] p-2 stagger-up"
      >
        <UTabs
          v-model="activeTab"
          :items="[
            {
              label: `Próximos (${upcoming.length})`,
              value: 'upcoming',
              icon: 'i-lucide-clock'
            },
            {
              label: `Anteriores (${previous.length})`,
              value: 'previous',
              icon: 'i-lucide-history'
            }
          ]"
          class="w-full"
        />
      </div>

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
            name="i-lucide-check-circle"
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
        v-if="activeTab === 'previous'"
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
            :readonly="true"
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
  </div>
</template>
