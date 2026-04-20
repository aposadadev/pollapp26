<script setup lang="ts">
import type { PredictionPoints } from '~/types'

interface Props {
  points: PredictionPoints
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

const config = computed(() => {
  const map = {
    3: { label: '3 pts', class: 'badge-3pts', icon: 'i-lucide-star' },
    1: { label: '1 pt', class: 'badge-1pt', icon: 'i-lucide-check' },
    0: { label: '0 pts', class: 'badge-0pts', icon: 'i-lucide-x' }
  }
  return map[props.points] ?? map[0]
})

const sizeClass = computed(() => ({
  sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  md: 'text-xs px-2 py-1 gap-1',
  lg: 'text-sm px-3 py-1.5 gap-1'
}[props.size]))
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-heading font-bold"
    :class="[config.class, sizeClass]"
  >
    <UIcon
      :name="config.icon"
      class="size-3"
    />
    {{ config.label }}
  </span>
</template>
