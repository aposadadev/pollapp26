<script setup lang="ts">
const groupContextStore = useGroupContextStore()

const emit = defineEmits<{
  (e: 'open-picker'): void
}>()
</script>

<template>
  <button
    class="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all duration-200 active:scale-[0.97] max-w-[180px]"
    :class="[
      groupContextStore.hasContext
        ? 'bg-secondary-500/10 dark:bg-secondary-400/10 hover:bg-secondary-500/20 dark:hover:bg-secondary-400/20'
        : 'bg-(--ui-bg-muted) hover:bg-(--ui-bg-elevated)'
    ]"
    @click="emit('open-picker')"
  >
    <!-- Icon -->
    <div
      class="size-5 rounded-lg flex items-center justify-center shrink-0"
      :class="[
        groupContextStore.hasContext
          ? 'bg-secondary-500 text-white'
          : 'bg-(--ui-border) text-(--ui-text-muted)'
      ]"
    >
      <UIcon
        name="i-lucide-trophy"
        class="size-3"
      />
    </div>

    <!-- Name -->
    <span
      class="text-[12px] font-bold truncate leading-none"
      :class="[
        groupContextStore.hasContext
          ? 'text-secondary-700 dark:text-secondary-300'
          : 'text-(--ui-text-muted)'
      ]"
    >
      {{
        groupContextStore.hasContext
          ? groupContextStore.activeGroupName
          : 'Elige liga'
      }}
    </span>

    <!-- Chevron -->
    <UIcon
      name="i-lucide-chevron-down"
      class="size-3 shrink-0 transition-colors"
      :class="[
        groupContextStore.hasContext
          ? 'text-secondary-500 dark:text-secondary-400'
          : 'text-(--ui-text-muted)'
      ]"
    />
  </button>
</template>
