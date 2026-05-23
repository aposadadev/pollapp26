<script setup lang="ts">
interface Props {
  value: number | null
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  size: 'md'
})

const emit = defineEmits<{
  increment: []
  decrement: []
}>()
</script>

<template>
  <div
    class="flex items-center"
    :class="size === 'sm' ? 'gap-2' : 'gap-3'"
  >
    <UButton
      icon="i-lucide-minus"
      color="neutral"
      variant="soft"
      class="rounded-full flex items-center justify-center transition-all bg-neutral-100 hover:bg-neutral-200 active:scale-90"
      :class="size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11'"
      @click="emit('decrement')"
    />

    <div :class="size === 'sm' ? 'w-8 text-center' : 'w-10 text-center'">
      <span
        class="font-heading font-bold text-secondary-600 dark:text-secondary-400 tabular-nums"
        :class="size === 'sm' ? 'text-xl' : 'text-3xl'"
      >
        {{ value === null ? '-' : value }}
      </span>
    </div>

    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="soft"
      class="rounded-full flex items-center justify-center transition-all bg-neutral-100 hover:bg-neutral-200 active:scale-90"
      :class="size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11'"
      @click="emit('increment')"
    />
  </div>
</template>
