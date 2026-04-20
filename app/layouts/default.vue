<script setup lang="ts">
defineOptions({ name: 'DefaultLayout' })

const appStore = useAppStore()
useHead({ title: () => appStore.pageTitle ? `${appStore.pageTitle} · Mundial 2026` : 'Mundial 2026' })
</script>

<template>
  <div>
    <!-- Header fijo superior -->
    <LayoutAppHeader />

    <!-- Contenido principal con espacio para header + bottom nav -->
    <main
      class="pt-[var(--app-header-height)] page-content min-h-screen bg-(--ui-bg)"
    >
      <slot />
    </main>

    <!-- Bottom Nav fijo -->
    <LayoutAppBottomNav />
  </div>
</template>
