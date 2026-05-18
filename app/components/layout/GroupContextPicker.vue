<script setup lang="ts">
interface Props {
  modelValue: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const groupContextStore = useGroupContextStore()
const appStore = useAppStore()
const toast = useToast()

const groupsComposable = useGroups(appStore.activeTournamentId)
const { groups, loading } = groupsComposable

onMounted(async () => {
  await groupsComposable.loadGroups()
})

// Tabla que el usuario está eligiendo antes de confirmar
const pendingBoardId = ref<string | null>(null)

// Sync with store whenever the sheet opens
watchEffect(() => {
  if (isOpen.value) {
    pendingBoardId.value = groupContextStore.boardId
  }
})

function selectBoard(boardId: string) {
  pendingBoardId.value = boardId
}

function confirm() {
  const selectedBoard = groups.value.find(b => b.id === pendingBoardId.value)
  if (!selectedBoard) {
    toast.add({ title: 'Selecciona una tabla', color: 'error' })
    return
  }

  const activeBoards = groups.value.filter(b => b.isActive)

  groupContextStore.setContext({
    groupId: 'global-group',
    groupName: 'Polla Mundial 2026',
    groupCode: 'GLOBAL',
    boardId: selectedBoard.id,
    boards: activeBoards.map((b, i) => ({
      id: b.id,
      number: b.number,
      totalPoints: b.totalPoints,
      currentPos: b.currentPos,
      name: `Tabla ${i + 1}`
    }))
  })

  isOpen.value = false
}

function goToGroups() {
  isOpen.value = false
  navigateTo('/groups')
}

const hasActiveGroups = computed(() =>
  groups.value.some(b => b.isActive)
)
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        @click="isOpen = false"
      />
    </Transition>

    <!-- Sheet -->
    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="fixed bottom-0 inset-x-0 z-50 max-w-lg mx-auto"
      >
        <div
          class="bg-(--ui-bg) rounded-t-[32px] shadow-2xl border border-(--ui-border) border-b-0 pb-safe"
          @click.stop
        >
          <!-- Handle bar -->
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 rounded-full bg-(--ui-border)" />
          </div>

          <!-- Header del sheet -->
          <div class="px-6 pt-2 pb-4 border-b border-(--ui-border)">
            <h2 class="font-heading text-lg font-black uppercase tracking-tight text-(--ui-text-highlighted)">
              Elige tu tabla
            </h2>
            <p class="text-xs text-(--ui-text-muted) mt-0.5">
              El ranking y tus predicciones se mostrarán según la tabla activa.
            </p>
          </div>

          <!-- Lista de tablas -->
          <div class="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <!-- Loading -->
            <div
              v-if="loading"
              class="space-y-3"
            >
              <USkeleton
                v-for="i in 3"
                :key="i"
                class="h-20 rounded-2xl"
              />
            </div>

            <!-- Sin tablas -->
            <div
              v-else-if="!groups.length"
              class="flex flex-col items-center py-10 gap-3"
            >
              <UIcon
                name="i-lucide-clipboard-list"
                class="size-12 text-(--ui-text-muted)"
              />
              <p class="text-sm font-bold text-(--ui-text-muted) text-center">
                No tienes ninguna tabla creada aún.
              </p>
              <UButton
                color="primary"
                variant="solid"
                icon="i-lucide-plus-circle"
                @click="goToGroups"
              >
                Pedir una tabla
              </UButton>
            </div>

            <!-- Tablas sin activar -->
            <div
              v-else-if="!hasActiveGroups"
              class="flex flex-col items-center py-8 gap-3"
            >
              <UIcon
                name="i-lucide-clock"
                class="size-12 text-(--ui-text-muted)"
              />
              <p class="text-sm font-bold text-(--ui-text-muted) text-center">
                Ninguna de tus tablas está activa todavía.
              </p>
              <UButton
                color="neutral"
                variant="outline"
                @click="goToGroups"
              >
                Ver mis tablas
              </UButton>
            </div>

            <!-- Cards por tabla -->
            <template v-else>
              <button
                v-for="(board, idx) in groups.filter(b => b.isActive)"
                :key="board.id"
                class="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 active:scale-[0.98]"
                :class="[
                  pendingBoardId === board.id
                    ? 'border-secondary-500 bg-secondary-500/5 dark:bg-secondary-400/10 shadow-md shadow-secondary-500/10'
                    : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-muted)'
                ]"
                @click="selectBoard(board.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <!-- Nombre de la tabla -->
                    <div class="flex items-center gap-2 mb-1">
                      <div
                        class="size-7 rounded-xl flex items-center justify-center shrink-0"
                        :class="[
                          pendingBoardId === board.id
                            ? 'bg-secondary-500 text-white'
                            : 'bg-(--ui-bg-muted) text-(--ui-text-muted)'
                        ]"
                      >
                        <UIcon
                          name="i-lucide-trophy"
                          class="size-3.5"
                        />
                      </div>
                      <span
                        class="font-heading font-black text-sm uppercase tracking-wide truncate"
                        :class="[
                          pendingBoardId === board.id
                            ? 'text-secondary-600 dark:text-secondary-400'
                            : 'text-(--ui-text-highlighted)'
                        ]"
                      >
                        Tabla {{ idx + 1 }}
                      </span>
                    </div>

                    <!-- Número -->
                    <span class="text-[11px] font-mono text-(--ui-text-muted) ml-9">
                      #{{ board.number }}
                    </span>
                  </div>

                  <!-- Check indicator -->
                  <Transition name="pop">
                    <div
                      v-if="pendingBoardId === board.id"
                      class="shrink-0 size-6 rounded-full bg-secondary-500 flex items-center justify-center shadow-sm"
                    >
                      <UIcon
                        name="i-lucide-check"
                        class="size-3.5 text-white"
                      />
                    </div>
                  </Transition>
                </div>
              </button>
            </template>
          </div>

          <!-- Footer con acciones -->
          <div class="px-4 pb-4 pt-3 flex gap-3 border-t border-(--ui-border)">
            <UButton
              color="neutral"
              variant="ghost"
              class="flex-1"
              @click="isOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="secondary"
              variant="solid"
              class="flex-1 font-heading font-bold uppercase tracking-wide"
              :disabled="!pendingBoardId"
              @click="confirm"
            >
              Confirmar
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.pop-enter-active {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease;
}
.pop-enter-from {
  transform: scale(0);
  opacity: 0;
}
</style>
