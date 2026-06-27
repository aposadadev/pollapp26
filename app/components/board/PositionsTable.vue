<script setup lang="ts">
import type { RankingEntry } from '~/types'

interface Props {
  entries: RankingEntry[]
  currentUserId?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'click-entry', entry: RankingEntry): void
}>()

const runtimeConfig = useRuntimeConfig()
const enableQualifiers = computed(() => runtimeConfig.public.enableQualifiers)
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(entry, i) in entries"
      :key="entry.boardId"
      class="card-elevated flex items-center justify-between py-2.5 px-3.5 transition-all duration-300 stagger-up active:scale-[0.98] cursor-pointer hover:border-secondary-500/30 hover:shadow-md hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
      :class="[
        entry.userId === currentUserId ? 'border-primary-500/30' : '',
        `stagger-d${Math.min(i + 1, 12)}`
      ]"
      @click="emit('click-entry', entry)"
    >
      <div class="flex items-center gap-3 min-w-0">
        <!-- Rank -->
        <span class="font-heading text-base font-black text-neutral-300 w-7 text-center shrink-0">
          {{ entry.currentPos }}
        </span>

        <!-- Avatar / Initials -->
        <div
          class="size-9 rounded-xl flex items-center justify-center font-heading font-bold text-xs transition-all shrink-0 overflow-hidden border border-(--ui-border)/50"
          :class="
            entry.userId === currentUserId
              ? 'bg-primary-500 text-white shadow-lg'
              : 'bg-secondary-500/10 text-secondary-600'
          "
        >
          <img
            v-if="entry.userPhotoURL"
            :src="entry.userPhotoURL"
            alt="Avatar"
            class="size-full object-cover"
            referrerpolicy="no-referrer"
          >
          <span v-else>{{ (entry.userDisplayName || '').substring(0, 2).toUpperCase() }}</span>
        </div>

        <!-- Name -->
        <div class="flex flex-col min-w-0">
          <span class="flex items-center gap-1 font-bold text-sm text-neutral-800 dark:text-white leading-none min-w-0">
            <span class="truncate">{{ entry.userDisplayName }}</span>
            <span
              v-if="entry.userId === currentUserId"
              class="text-[9px] text-primary-500 font-black uppercase tracking-widest shrink-0"
            >Tú</span>
          </span>
          <div class="flex items-center gap-1.5 mt-1 text-[9px] xs:text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
            <span>#{{ entry.boardNumber }}</span>
            <span class="text-neutral-300 dark:text-neutral-800">•</span>
            <span class="flex items-center gap-0.5 text-secondary-500 dark:text-secondary-400">
              <UIcon
                name="i-lucide-target"
                class="size-3.5 shrink-0"
              />
              <span>{{ entry.predsThreePoints }}</span>
            </span>
            <span class="text-neutral-300 dark:text-neutral-800">•</span>
            <span class="flex items-center gap-0.5 text-primary-500 dark:text-primary-400">
              <UIcon
                name="i-lucide-check-circle"
                class="size-3.5 shrink-0"
              />
              <span>{{ entry.predsOnePoints }}</span>
            </span>
            <template v-if="enableQualifiers">
              <span class="text-neutral-300 dark:text-neutral-800">•</span>
              <span class="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                <UIcon
                  name="i-lucide-trophy"
                  class="size-3.5 shrink-0"
                />
                <span>{{ entry.totalTeamsGuessed ?? 0 }}</span>
              </span>
            </template>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Points -->
        <div class="text-right">
          <span
            class="block font-heading text-base font-black text-secondary-600 dark:text-secondary-400 leading-none"
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
