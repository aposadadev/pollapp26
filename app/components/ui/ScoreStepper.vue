<script setup lang="ts">
const props = defineProps<{
  modelValue: number | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const increment = () => {
  if (props.disabled) return
  emit('update:modelValue', (props.modelValue || 0) + 1)
}

const decrement = () => {
  if (props.disabled) return
  const current = props.modelValue || 0
  if (current > 0) {
    emit('update:modelValue', current - 1)
  }
}
</script>

<template>
  <div class="flex items-center gap-4">
    <UButton
      icon="i-heroicons-minus"
      color="neutral"
      variant="soft"
      size="lg"
      class="rounded-full w-11 h-11 flex items-center justify-center transition-all bg-neutral-100 hover:bg-neutral-200 active:scale-90"
      :disabled="disabled"
      @click="decrement"
    />

    <div class="w-12 text-center">
      <span
        class="text-3xl font-heading font-bold text-secondary-600 dark:text-secondary-400"
      >
        {{ modelValue ?? 0 }}
      </span>
    </div>

    <UButton
      icon="i-heroicons-plus"
      color="neutral"
      variant="soft"
      size="lg"
      class="rounded-full w-11 h-11 flex items-center justify-center transition-all bg-neutral-100 hover:bg-neutral-200 active:scale-90"
      :disabled="disabled"
      @click="increment"
    />
  </div>
</template>
