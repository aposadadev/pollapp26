<script setup lang="ts">
interface Props {
  logoUrl?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

const sizeClass = computed(() => ({
  sm: 'size-8',
  md: 'size-11',
  lg: 'size-14'
}[props.size]))

const fallbackInitial = computed(() => props.name.charAt(0).toUpperCase())
const hasLogo = computed(() => !!props.logoUrl)
</script>

<template>
  <div
    class="rounded-full bg-(--ui-bg-elevated) flex items-center justify-center overflow-hidden shrink-0 border border-(--ui-border)"
    :class="sizeClass"
  >
    <img
      v-if="hasLogo"
      :src="logoUrl"
      :alt="name"
      class="w-full h-full object-contain p-1"
      loading="lazy"
    >
    <span
      v-else
      class="font-bold text-(--ui-text-muted)"
      :class="size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'"
    >
      {{ fallbackInitial }}
    </span>
  </div>
</template>
