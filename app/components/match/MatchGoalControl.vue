<script setup lang="ts">
interface Props {
  value: number
  isLocked?: boolean
}
defineProps<Props>()
const emit = defineEmits<{
  increment: []
  decrement: []
}>()
</script>

<template>
  <div class="flex items-center gap-3">
    <UButton
      icon="i-heroicons-minus"
      color="neutral"
      variant="soft"
      class="rounded-full w-11 h-11 flex items-center justify-center transition-all bg-neutral-100 hover:bg-neutral-200 active:scale-90"
      :disabled="isLocked"
      @click="emit('decrement')"
    />

    <div class="w-10 text-center">
      <span
        class="text-3xl font-heading font-bold text-secondary-600 dark:text-secondary-400 tabular-nums"
      >
        {{ value }}
      </span>
    </div>

    <UButton
      icon="i-heroicons-plus"
      color="neutral"
      variant="soft"
      class="rounded-full w-11 h-11 flex items-center justify-center transition-all bg-neutral-100 hover:bg-neutral-200 active:scale-90"
      :disabled="isLocked"
      @click="emit('increment')"
    />
  </div>
</template>
