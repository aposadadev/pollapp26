<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  supertitle?: string
  showBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  supertitle: 'FIFA WORLD CUP 2026™'
})
</script>

<template>
  <div
    class="relative w-full pb-[100px] rounded-b-[48px] bg-gradient-to-b from-[#0a1028] to-[#1b2b66] dark:from-[#050815] dark:to-[#0f172a] px-6 pt-6"
  >
    <!-- Top nav row inside hero -->
    <div class="flex items-center justify-between pt-safe-top">
      <!-- Back button slot mapping to left -->
      <div
        v-if="showBack"
        class="-ml-2"
      >
        <slot name="back" />
      </div>
      <div v-else />

      <div class="flex items-center gap-4">
        <!-- Actions slot mapping to right -->
        <slot name="actions" />
      </div>
    </div>

    <!-- Center Title Content -->
    <div
      class="flex flex-col items-center justify-center mt-6 gap-2 stagger-up"
    >
      <span
        class="text-secondary-400 text-[11px] font-bold tracking-[0.2em] font-heading uppercase opacity-90 drop-shadow-sm"
      >
        {{ subtitle ?? props.supertitle }}
      </span>
      <span
        class="text-white text-4xl font-black font-heading leading-none drop-shadow-md text-center max-w-xs tracking-tight"
      >
        {{ title }}
      </span>
    </div>

    <slot />
  </div>
</template>
