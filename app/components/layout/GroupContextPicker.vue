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

// Grupo que el usuario está eligiendo antes de confirmar
const pendingGroupId = ref<string | null>(null)
const pendingBoardId = ref<string | null>(null)

// Sync with store whenever the sheet opens (or store context changes externally)
watchEffect(() => {
  if (isOpen.value) {
    pendingGroupId.value = groupContextStore.groupId
    pendingBoardId.value = groupContextStore.boardId
  }
})

const pendingGroup = computed(() =>
  groups.value.find(g => g.id === pendingGroupId.value) ?? null
)

function selectGroup(groupId: string, boardId: string | undefined) {
  pendingGroupId.value = groupId
  pendingBoardId.value = boardId ?? null
}

function confirm() {
  const group = pendingGroup.value
  if (!group || !pendingBoardId.value) {
    toast.add({ title: 'Selecciona una liga y tabla', color: 'error' })
    return
  }

  groupContextStore.setContext({
    groupId: group.id,
    groupName: group.name,
    groupCode: group.code,
    boardId: pendingBoardId.value
  })

  isOpen.value = false
}

function goToGroups() {
  isOpen.value = false
  navigateTo('/groups')
}

const hasActiveGroups = computed(() =>
  groups.value.some(g => g.userBoardIsActive)
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
              Elige tu liga
            </h2>
            <p class="text-xs text-(--ui-text-muted) mt-0.5">
              El ranking y tus predicciones se mostrarán según la liga activa.
            </p>
          </div>

          <!-- Lista de grupos -->
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

            <!-- Sin grupos -->
            <div
              v-else-if="!groups.length"
              class="flex flex-col items-center py-10 gap-3"
            >
              <UIcon
                name="i-lucide-users"
                class="size-12 text-(--ui-text-muted)"
              />
              <p class="text-sm font-bold text-(--ui-text-muted) text-center">
                No perteneces a ninguna liga aún.
              </p>
              <UButton
                color="primary"
                variant="solid"
                icon="i-lucide-search"
                @click="goToGroups"
              >
                Buscar una liga
              </UButton>
            </div>

            <!-- Grupos sin tabla activa solamente -->
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
                Ver mis ligas
              </UButton>
            </div>

            <!-- Cards por grupo -->
            <template v-else>
              <button
                v-for="group in groups.filter(g => g.userBoardIsActive)"
                :key="group.id"
                class="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 active:scale-[0.98]"
                :class="[
                  pendingGroupId === group.id
                    ? 'border-secondary-500 bg-secondary-500/5 dark:bg-secondary-400/10 shadow-md shadow-secondary-500/10'
                    : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-muted)'
                ]"
                @click="selectGroup(group.id, group.userBoardId)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <!-- Nombre del grupo -->
                    <div class="flex items-center gap-2 mb-1">
                      <div
                        class="size-7 rounded-xl flex items-center justify-center shrink-0"
                        :class="[
                          pendingGroupId === group.id
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
                          pendingGroupId === group.id
                            ? 'text-secondary-600 dark:text-secondary-400'
                            : 'text-(--ui-text-highlighted)'
                        ]"
                      >
                        {{ group.name }}
                      </span>
                    </div>

                    <!-- Código -->
                    <span class="text-[11px] font-mono text-(--ui-text-muted) ml-9">
                      #{{ group.code }}
                    </span>
                  </div>

                  <!-- Check indicator -->
                  <Transition name="pop">
                    <div
                      v-if="pendingGroupId === group.id"
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
              :disabled="!pendingGroupId || !pendingBoardId"
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
