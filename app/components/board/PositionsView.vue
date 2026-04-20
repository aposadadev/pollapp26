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
  currentUserId: undefined,
})

const formattedUpdate = computed(() =>
  props.lastUpdated
    ? new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(props.lastUpdated)
    : null
)
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
        v-if="!loading && entries.length >= 3"
        class="-mx-2 stagger-up stagger-d3"
      >
        <BoardPodiumLayout :entries="entries" />
      </div>

      <!-- Tabla completa -->
      <div class="flex flex-col gap-4 stagger-up stagger-d4">
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

        <template v-else-if="entries.length">
          <BoardPositionsTable
            :entries="entries"
            :current-user-id="currentUserId"
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
          <span class="text-sm font-bold text-neutral-400 uppercase tracking-widest">
            No hay registros aún
          </span>
        </div>
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
  </div>
</template>
