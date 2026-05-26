<script setup lang="ts">
import type { PredictionPoints } from '~/types'

interface Props {
  points: PredictionPoints | null
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

const config = computed(() => {
  if (props.points === null) {
    return {
      label: 'Pendiente',
      class: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 ring-1 ring-neutral-200 dark:ring-neutral-700/50 shadow-none uppercase tracking-wider',
      icon: 'i-lucide-clock',
      iconClass: 'text-neutral-400 dark:text-neutral-500'
    }
  }
  const map = {
    3: {
      label: '3 PTS',
      class: 'bg-emerald-500 text-white dark:bg-emerald-600 ring-4 ring-emerald-500/20 dark:ring-emerald-600/30 shadow-lg shadow-emerald-500/20 uppercase tracking-wider',
      icon: 'i-lucide-award',
      iconClass: 'animate-bounce text-yellow-300'
    },
    1: {
      label: '1 PT',
      class: 'bg-amber-500 text-white dark:bg-amber-600 ring-4 ring-amber-500/20 dark:ring-amber-600/30 shadow-md shadow-amber-500/20 uppercase tracking-wider',
      icon: 'i-lucide-check-circle',
      iconClass: 'text-amber-100'
    },
    0: {
      label: '0 PTS',
      class: 'bg-neutral-400 dark:bg-neutral-600 text-white dark:text-neutral-300 ring-4 ring-neutral-500/10 dark:ring-neutral-600/15 shadow-sm uppercase tracking-wider',
      icon: 'i-lucide-x-circle',
      iconClass: 'text-neutral-200 dark:text-neutral-400'
    }
  }
  return map[props.points] ?? map[0]
})

const sizeClass = computed(() => ({
  sm: 'text-[9px] px-2 py-0.5 gap-1 font-extrabold',
  md: 'text-[11px] px-3 py-1 gap-1.5 font-black',
  lg: 'text-xs px-4 py-1.5 gap-2 font-black'
}[props.size]))
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-heading transition-all duration-300 hover:scale-105 select-none"
    :class="[config.class, sizeClass]"
  >
    <UIcon
      :name="config.icon"
      class="size-4 shrink-0"
      :class="config.iconClass"
    />
    {{ config.label }}
  </span>
</template>
