<script setup lang="ts">
defineOptions({ name: 'DefaultLayout' })
</script>

<template>
  <UApp>
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

    <UToaster />
  </UApp>
</template>
