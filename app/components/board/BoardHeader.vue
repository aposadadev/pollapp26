<script setup lang="ts">
import type { Board } from '~/types'

interface Props {
  board: Board
  userBoardsInGroup?: Board[]
}

defineProps<Props>()

const positionIcon = (board: Board) => {
  if (board.currentPos < board.previousPos && board.previousPos > 0)
    return {
      icon: 'i-lucide-trending-up',
      color: 'text-secondary-500'
    }
  if (board.currentPos > board.previousPos && board.previousPos > 0)
    return {
      icon: 'i-lucide-trending-down',
      color: 'text-error-500'
    }
  return { icon: 'i-lucide-minus', color: 'text-(--ui-text-muted)' }
}
</script>

<template>
  <div
    class="relative w-full pb-[100px] rounded-b-[48px] bg-gradient-to-b from-primary-900 to-primary-700 dark:from-primary-950 dark:to-primary-900 px-6 pt-10"
  >
    <div class="relative z-10">
      <!-- Selector de Tablas (Pestañas) -->
      <div
        v-if="userBoardsInGroup && userBoardsInGroup.length > 1"
        class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6 border-b border-white/10 stagger-up"
      >
        <NuxtLink
          v-for="b in userBoardsInGroup"
          :key="b.id"
          :to="`/board/${b.id}`"
          class="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 whitespace-nowrap"
          :class="[
            b.id === board.id
              ? 'bg-secondary-500 text-white shadow-lg shadow-secondary-500/20 border-2 border-secondary-500'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-2 border-white/5'
          ]"
        >
          <UIcon
            name="i-lucide-clipboard-list"
            class="size-3.5"
          />
          Tabla #{{ b.number }}
        </NuxtLink>
      </div>

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
          <UIcon
            name="i-lucide-crosshair"
            class="size-4 text-secondary-400 shrink-0"
          />
          <div class="flex flex-col">
            <span class="text-white text-[12px] font-black leading-none">{{ board.predsThreePoints }} Exactos</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-circle-check"
            class="size-4 text-primary-400 shrink-0"
          />
          <div class="flex flex-col">
            <span class="text-white text-[12px] font-black leading-none">{{ board.predsOnePoints }} Parciales</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-trophy"
            class="size-4 text-amber-400 shrink-0"
          />
          <div class="flex flex-col">
            <span class="text-white text-[12px] font-black leading-none">{{ board.totalTeamsGuessed ?? 0 }} Clasificados</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
