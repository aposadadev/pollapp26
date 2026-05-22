<script setup lang="ts">
defineOptions({ name: 'DefaultLayout' })

const appStore = useAppStore()
useHead({ title: () => appStore.pageTitle ? `${appStore.pageTitle} · Mundial 2026` : 'Mundial 2026' })
</script>

<template>
  <div class="bg-(--ui-bg) min-h-screen">
    <!-- Header fijo superior -->
    <LayoutAppHeader />

    <!-- Contenido principal con espacio para header + bottom nav -->
    <main
      class="pt-[var(--app-header-height)] page-content min-h-screen bg-(--ui-bg) sm:max-w-2xl sm:mx-auto w-full sm:border-x sm:border-(--ui-border)/50 sm:shadow-sm"
    >
      <slot />
    </main>

    <!-- Bottom Nav fijo -->
    <LayoutAppBottomNav />
  </div>
</template>
