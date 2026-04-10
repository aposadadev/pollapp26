<script setup lang="ts">
import type { Board } from '~/types'

interface Props {
  board: Board
}

defineProps<Props>()

const positionIcon = (board: Board) => {
  if (board.currentPos < board.previousPos && board.previousPos > 0)
    return {
      icon: 'i-lucide-trending-up',
      color: 'text-[var(--ui-color-secondary-500)]'
    }
  if (board.currentPos > board.previousPos && board.previousPos > 0)
    return {
      icon: 'i-lucide-trending-down',
      color: 'text-[var(--ui-color-error-500)]'
    }
  return { icon: 'i-lucide-minus', color: 'text-(--ui-text-muted)' }
}
</script>

<template>
  <div
    class="relative w-full pb-[100px] rounded-b-[48px] bg-gradient-to-b from-[#0a1028] to-[#1b2b66] dark:from-[#050815] dark:to-[#0f172a] px-6 pt-10"
  >
    <div class="relative z-10">
      <div class="flex items-start justify-between gap-3">
        <!-- Info del grupo -->
        <div class="min-w-0 stagger-up">
          <p
            class="text-[11px] text-white/70 truncate font-heading uppercase tracking-widest"
          >
            {{ board.groupName }}
          </p>
          <p
            class="font-heading text-2xl font-black text-white uppercase mt-0.5 tracking-tight"
          >
            Tabla #{{ board.number }}
          </p>
        </div>

        <!-- Puntos y posición -->
        <div
          class="flex items-center gap-5 shrink-0 stagger-up stagger-d2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-[20px] px-4 py-3"
        >
          <div class="text-center">
            <p
              class="font-heading text-2xl font-black text-white tabular-nums leading-none"
            >
              {{ board.totalPoints }}
            </p>
            <p
              class="text-[9px] text-white/60 mt-1 uppercase tracking-widest font-bold"
            >
              PTS
            </p>
          </div>

          <div class="w-[1px] h-8 bg-white/20" />

          <div class="text-center">
            <div class="flex items-center justify-center gap-1">
              <p
                class="font-heading text-2xl font-black text-white tabular-nums leading-none"
              >
                {{ board.currentPos > 0 ? `#${board.currentPos}` : "—" }}
              </p>
              <UIcon
                :name="positionIcon(board).icon"
                class="size-4"
                :class="positionIcon(board).color"
              />
            </div>
            <p
              class="text-[9px] text-white/60 mt-1 uppercase tracking-widest font-bold"
            >
              RANK
            </p>
          </div>
        </div>
      </div>

      <!-- Stats secundarias inline -->
      <div
        class="flex items-center justify-start gap-4 mt-8 stagger-up stagger-d3"
      >
        <div class="flex items-center gap-2">
          <span class="text-[16px]">{{ "🎯" }}</span>
          <div class="flex flex-col">
            <span class="text-white text-[12px] font-black leading-none">{{ board.predsThreePoints }} Exactos</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[16px]">{{ "✅" }}</span>
          <div class="flex flex-col">
            <span class="text-white text-[12px] font-black leading-none">{{ board.predsOnePoints }} Parciales</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
