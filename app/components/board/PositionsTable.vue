<script setup lang="ts">
import type { RankingEntry } from '~/types'

interface Props {
  entries: RankingEntry[]
  currentUserId?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="(entry, i) in entries"
      :key="entry.boardId"
      class="card-elevated flex items-center justify-between p-4 transition-all duration-300 stagger-up active:scale-[0.98]"
      :class="[
        entry.userId === currentUserId ? 'border-primary-500/30' : '',
        `stagger-d${Math.min(i + 1, 12)}`
      ]"
    >
      <div class="flex items-center gap-4">
        <!-- Rank -->
        <span class="font-heading text-lg font-black text-neutral-300 w-6">
          {{ entry.currentPos }}
        </span>

        <!-- Avatar / Initials -->
        <div
          class="size-10 rounded-xl flex items-center justify-center font-heading font-bold text-sm transition-all"
          :class="
            entry.userId === currentUserId
              ? 'bg-primary-500 text-white shadow-lg'
              : 'bg-secondary-500/10 text-secondary-600'
          "
        >
          {{ entry.userDisplayName.substring(0, 2).toUpperCase() }}
        </div>

        <!-- Name -->
        <div class="flex flex-col">
          <span class="font-bold text-neutral-800 dark:text-white leading-none">
            {{ entry.userDisplayName }}
            <span
              v-if="entry.userId === currentUserId"
              class="ml-1 text-[9px] text-primary-500 font-black uppercase tracking-widest"
            >Tú</span>
          </span>
          <span
            class="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1"
          >#{{ entry.boardNumber }}</span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Points -->
        <div class="text-right">
          <span
            class="block font-heading text-lg font-black text-secondary-600 dark:text-secondary-400 leading-none"
          >
            {{ entry.totalPoints }}
          </span>
          <span
            class="text-[9px] text-neutral-400 font-bold uppercase tracking-[0.1em]"
          >Pts</span>
        </div>

        <!-- Delta Icon -->
        <div class="w-6 flex justify-center">
          <UIcon
            v-if="entry.positionDelta === 'up'"
            name="i-lucide-chevron-up"
            class="size-5 text-secondary-500"
          />
          <UIcon
            v-else-if="entry.positionDelta === 'down'"
            name="i-lucide-chevron-down"
            class="size-5 text-error-500"
          />
          <UIcon
            v-else
            name="i-lucide-minus"
            class="size-4 text-neutral-300"
          />
        </div>
      </div>
    </div>
  </div>
</template>
