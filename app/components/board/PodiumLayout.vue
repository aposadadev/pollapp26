<script setup lang="ts">
import type { RankingEntry } from '~/types'

interface Props {
  entries: RankingEntry[]
}

defineProps<Props>()

const displayOrder = [1, 0, 2] // 2nd, 1st, 3rd
</script>

<template>
  <div
    v-if="entries.length >= 3"
    class="flex justify-center items-end gap-3 px-2 py-8"
  >
    <div
      v-for="(idx, i) in displayOrder"
      :key="entries[idx]?.userId || i"
      class="flex-1 flex flex-col items-center gap-3 stagger-up transition-all duration-700"
      :class="`stagger-d${i + 2}`"
    >
      <div class="relative">
        <div
          v-if="idx === 0"
          class="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <UIcon
            name="i-lucide-crown"
            class="size-5 text-secondary-400"
          />
        </div>
        <div
          class="rounded-full bg-(--ui-bg-elevated) border-2 flex items-center justify-center shadow-md transition-transform duration-500"
          :class="
            idx === 0
              ? 'w-20 h-20 border-secondary-500 scale-110'
              : 'w-16 h-16 border-(--ui-border)'
          "
        >
          <span
            class="font-heading font-bold text-secondary-600 dark:text-secondary-400"
            :class="idx === 0 ? 'text-xl' : 'text-lg'"
          >
            {{ entries[idx]?.userDisplayName?.substring(0, 2).toUpperCase() }}
          </span>
        </div>
      </div>

      <span
        class="text-[10px] font-black text-neutral-500 uppercase tracking-widest text-center truncate w-20"
      >
        {{ entries[idx]?.userDisplayName }}
      </span>

      <!-- Bar -->
      <div
        class="w-full rounded-t-2xl flex flex-col items-center justify-start pt-4 transition-all duration-1000 ease-out shadow-lg"
        :class="[
          idx === 0
            ? 'h-32 bg-secondary-600 text-white'
            : idx === 1
              ? 'h-24 bg-secondary-500/10 text-secondary-700'
              : 'h-16 bg-secondary-500/5 text-secondary-600'
        ]"
      >
        <span class="font-heading text-xl font-black">
          {{ entries[idx]?.totalPoints }}
        </span>
        <span class="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Puntos</span>
      </div>
    </div>
  </div>
</template>
