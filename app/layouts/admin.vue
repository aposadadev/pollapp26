<script setup lang="ts">
defineOptions({ name: 'AdminLayout' })

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
  { to: '/admin/groups', label: 'Grupos', icon: 'i-lucide-users' },
  { to: '/admin/matches', label: 'Partidos', icon: 'i-lucide-trophy' },
  { to: '/admin/teams', label: 'Equipos', icon: 'i-lucide-shield' },
  { to: '/admin/seed', label: 'Seed', icon: 'i-lucide-database' }
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-(--ui-bg)">
    <!-- Header admin -->
    <header
      class="fixed top-0 inset-x-0 z-40 h-[var(--app-header-height)]
             bg-(--ui-bg)/80 backdrop-blur-md border-b border-(--ui-border)/50
             shadow-sm flex items-center px-4 gap-3
             transition-all duration-300"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-(--ui-text-muted) hover:text-(--ui-text) transition-colors duration-200"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="size-4"
        />
        <span class="text-sm font-medium">Volver</span>
      </NuxtLink>
      <div class="w-px h-5 bg-(--ui-border)" />
      <span class="font-heading text-sm font-black text-(--ui-text) uppercase tracking-wider">Panel Admin</span>
    </header>

    <!-- Contenido admin -->
    <main class="pt-[var(--app-header-height)] flex-1 max-w-5xl mx-auto w-full">
      <!-- Tabs de navegación admin — filter chips -->
      <div class="px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
        <div class="flex gap-2 min-w-max">
          <NuxtLink
            v-for="item in adminNav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 transition-all duration-200 active:scale-95 whitespace-nowrap"
            :class="[
              $route.path === item.to
                ? 'border-primary-500 bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text-muted) hover:border-(--ui-border-muted)'
            ]"
          >
            <UIcon
              :name="item.icon"
              class="size-3.5"
            />
            <span class="text-xs font-bold uppercase tracking-wider">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </div>

      <slot />
    </main>
  </div>
</template>
