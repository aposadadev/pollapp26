<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()
const groupContextStore = useGroupContextStore()

// groupId reactivo correctamente (como ref, no .value)
const groupId = computed(() => route.params.groupId as string)
const { entries, loading, lastUpdated } = usePositions(groupId)

// Si el groupId de la URL coincide con el contexto, usamos el boardId del contexto
// para el botón volver. Si no, volvemos a /groups
const backTo = computed(() =>
  groupContextStore.activeGroupId === groupId.value && groupContextStore.activeBoardId
    ? `/board/${groupContextStore.activeBoardId}`
    : '/groups'
)

const groupName = computed(
  () =>
    groupContextStore.activeGroupId === groupId.value
      ? groupContextStore.activeGroupName
      : null
)

onMounted(() => appStore.setPageTitle('Ranking'))

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
    <!-- Hero Header -->
    <LayoutPageHeader
      title="RANKING"
      :subtitle="groupName ?? 'CLASIFICACIÓN'"
    >
      <template #actions>
        <div
          v-if="formattedUpdate"
          class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md"
        >
          <span class="size-1.5 rounded-full bg-[var(--ui-color-green-400)] animate-pulse" />
          <span class="text-[9px] font-bold text-white uppercase tracking-widest">EN VIVO {{ formattedUpdate }}</span>
        </div>
      </template>
    </LayoutPageHeader>

    <!-- Main content overlapping header -->
    <div class="relative z-10 -mt-16 px-4 sm:px-6 flex flex-col gap-8 pb-32">
      <!-- Podium -->
      <div
        v-if="!loading && entries.length >= 3"
        class="-mx-2 stagger-up stagger-d3"
      >
        <BoardPodiumLayout :entries="entries" />
      </div>

      <!-- Full Standings -->
      <div class="flex flex-col gap-4 stagger-up stagger-d4">
        <h3
          class="text-[14px] font-black text-neutral-500 dark:text-neutral-400 tracking-widest font-heading px-2 mb-2"
        >
          TABLA COMPLETA
        </h3>

        <div
          v-if="loading"
          class="space-y-4 px-2"
        >
          <USkeleton
            v-for="i in 5"
            :key="i"
            class="h-20 rounded-[20px] w-full"
          />
        </div>

        <template v-else-if="entries.length">
          <BoardPositionsTable
            :entries="entries"
            :current-user-id="authStore.user?.id"
          />
        </template>

        <div
          v-else
          class="w-full flex flex-col items-center justify-center p-12 bg-(--ui-bg-elevated) rounded-[24px] border border-(--ui-border) border-dashed"
        >
          <UIcon
            name="i-lucide-trophy"
            class="size-16 mx-auto mb-4 text-neutral-300"
          />
          <span class="text-sm font-bold text-neutral-400 uppercase tracking-widest">No hay registros aún</span>
        </div>
      </div>

      <!-- Volver a Mi Tabla -->
      <div class="flex justify-center mt-2">
        <UButton
          :to="backTo"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
          size="sm"
        >
          Volver a mi tabla
        </UButton>
      </div>
    </div>
  </div>
</template>
