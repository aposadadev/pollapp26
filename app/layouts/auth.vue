<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val) => {
    colorMode.preference = val ? 'dark' : 'light'
  }
})
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col bg-(--ui-bg) relative">
      <!-- Theme toggle flotante glass -->
      <div class="fixed top-safe-top right-4 z-50 mt-4">
        <ClientOnly>
          <button
            class="p-2.5 rounded-full bg-white/80 dark:bg-[#1e2230]/80 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-lg text-(--ui-text) hover:scale-105 transition-all duration-200"
            aria-label="Cambiar modo de color"
            @click="isDark = !isDark"
          >
            <UIcon
              :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
              class="size-4.5"
            />
          </button>
        </ClientOnly>
      </div>

      <slot />
    </div>
    <UToaster />
  </UApp>
</template>
