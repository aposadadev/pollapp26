<script setup lang="ts">
defineOptions({ name: 'AdminLayout' })
definePageMeta({ middleware: 'admin' })
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col bg-(--ui-bg-muted)">
      <!-- Header admin con glassmorphism -->
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
          <span class="text-sm">Volver</span>
        </NuxtLink>
        <USeparator
          orientation="vertical"
          class="h-5"
        />
        <span class="font-heading text-sm font-semibold text-(--ui-text) uppercase tracking-wide">Panel Admin</span>
      </header>

      <!-- Contenido admin -->
      <main class="pt-[var(--app-header-height)] p-4 flex-1">
        <!-- Tabs de navegación admin -->
        <div class="mb-4 flex gap-2 flex-wrap">
          <UButton
            v-for="item in adminNav"
            :key="item.to"
            :to="item.to"
            :color="$route.path === item.to ? 'primary' : 'neutral'"
            :variant="$route.path === item.to ? 'solid' : 'ghost'"
            :icon="item.icon"
            size="sm"
            class="transition-all duration-200"
          >
            {{ item.label }}
          </UButton>
        </div>

        <slot />
      </main>
    </div>

    <UToaster />
  </UApp>
</template>

<script lang="ts">
const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
  { to: '/admin/groups', label: 'Grupos', icon: 'i-lucide-users' },
  { to: '/admin/matches', label: 'Partidos', icon: 'i-lucide-trophy' },
  { to: '/admin/teams', label: 'Equipos', icon: 'i-lucide-shield' },
  { to: '/admin/seed', label: 'Seed', icon: 'i-lucide-database' }
]
</script>
