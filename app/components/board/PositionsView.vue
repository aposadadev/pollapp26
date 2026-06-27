<script setup lang="ts">
import type { RankingEntry } from '~/types'

interface Props {
  title?: string
  subtitle?: string
  entries: RankingEntry[]
  loading: boolean
  lastUpdated: Date | null
  currentUserId?: string
  backTo?: string
  backLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'RANKING',
  subtitle: 'CLASIFICACIÓN',
  backTo: undefined,
  backLabel: undefined,
  currentUserId: undefined
})

const formattedUpdate = computed(() =>
  props.lastUpdated
    ? new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(props.lastUpdated)
    : null
)

const hasStartedWithPoints = computed(() =>
  props.entries.some(entry => entry.totalPoints > 0)
)

const showPodium = computed(() =>
  !props.loading && hasStartedWithPoints.value && props.entries.length >= 3
)

const tableEntries = computed(() => {
  if (!hasStartedWithPoints.value) {
    // Ordenar todos por número de tabla cuando no ha empezado el torneo con puntos
    const sorted = [...props.entries].sort((a, b) => a.boardNumber - b.boardNumber)
    // Re-indexar la posición (1, 2, 3...) para que concuerde con el orden físico
    return sorted.map((entry, index) => ({
      ...entry,
      currentPos: index + 1
    }))
  }

  return props.entries
})

const selectedEntry = ref<RankingEntry | null>(null)
const isModalOpen = ref(false)

function showUserDetail(entry: RankingEntry) {
  selectedEntry.value = entry
  isModalOpen.value = true
}
</script>

<template>
  <div class="relative font-sans">
    <LayoutPageHeader
      :title="title"
      :subtitle="subtitle"
    >
      <template #actions>
        <div
          v-if="formattedUpdate"
          class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md"
        >
          <span class="size-1.5 rounded-full bg-secondary-400 animate-pulse" />
          <span class="text-[9px] font-bold text-white uppercase tracking-widest">
            EN VIVO {{ formattedUpdate }}
          </span>
        </div>
      </template>
    </LayoutPageHeader>

    <div class="relative z-10 -mt-16 px-4 sm:px-6 flex flex-col gap-8 pb-32">
      <!-- Slot para el group picker (solo en positions.vue global) -->
      <slot name="top" />

      <!-- Podium -->
      <div
        v-if="showPodium"
        class="-mx-2 stagger-up stagger-d3"
      >
        <BoardPodiumLayout
          :entries="entries"
          @click-entry="showUserDetail"
        />
      </div>

      <!-- Tabla completa -->
      <div
        v-if="loading || tableEntries.length"
        class="flex flex-col gap-4 stagger-up stagger-d4"
      >
        <h3 class="text-[14px] font-black text-neutral-500 dark:text-neutral-400 tracking-widest font-heading px-2 mb-2">
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

        <template v-else-if="tableEntries.length">
          <BoardPositionsTable
            :entries="tableEntries"
            :current-user-id="currentUserId"
            @click-entry="showUserDetail"
          />
        </template>
      </div>

      <!-- Empty state: no registries at all -->
      <div
        v-else-if="!loading && !entries.length"
        class="w-full flex flex-col items-center justify-center p-12 bg-(--ui-bg-elevated) rounded-[24px] border border-(--ui-border) border-dashed stagger-up stagger-d4"
      >
        <UIcon
          name="i-lucide-trophy"
          class="size-16 mx-auto mb-4 text-neutral-300"
        />
        <span class="text-sm font-bold text-neutral-400 uppercase tracking-widest">
          No hay registros aún
        </span>
      </div>

      <!-- Botón volver (solo en la página de grupo) -->
      <div
        v-if="backTo"
        class="flex justify-center mt-2"
      >
        <UButton
          :to="backTo"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
          size="sm"
        >
          {{ backLabel }}
        </UButton>
      </div>
    </div>

    <!-- Modal de detalle de board de usuario -->
    <BoardDetailModal
      v-model:open="isModalOpen"
      :board-id="selectedEntry?.boardId ?? null"
      :user-name="selectedEntry?.userDisplayName ?? ''"
      :user-photo="selectedEntry?.userPhotoURL ?? ''"
      :board-number="selectedEntry?.boardNumber ?? 0"
      :total-points="selectedEntry?.totalPoints ?? 0"
      :current-pos="selectedEntry?.currentPos ?? 0"
      :preds-three-points="selectedEntry?.predsThreePoints ?? 0"
      :preds-one-points="selectedEntry?.predsOnePoints ?? 0"
      :total-teams-guessed="selectedEntry?.totalTeamsGuessed ?? 0"
    />
  </div>
</template>
