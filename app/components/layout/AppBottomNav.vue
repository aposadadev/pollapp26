<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const groupContextStore = useGroupContextStore()

// 5 items fijos siempre visibles. "Tabla" apunta al board activo si hay contexto, o a /groups si no.
const navItems = computed(() => {
  const boardTo = groupContextStore.activeBoardId
    ? `/board/${groupContextStore.activeBoardId}`
    : '/groups'

  const items = [
    { to: '/', label: 'INICIO', icon: 'i-lucide-house' },
    { to: '/matches', label: 'PARTIDOS', icon: 'i-lucide-calendar' },
    { to: boardTo, label: 'TABLA', icon: 'i-lucide-clipboard-list', matchPrefix: groupContextStore.activeBoardId ? '/board' : '/groups' },
    { to: '/positions', label: 'RANKING', icon: 'i-lucide-trophy' },
    { to: '/instructions', label: 'REGLAS', icon: 'i-lucide-book-open' }
  ]

  // Si es admin, reemplaza Reglas por Admin
  if (authStore.isAdmin) {
    items[4] = { to: '/admin', label: 'ADMIN', icon: 'i-lucide-shield-check' }
  }

  return items
})

const isActive = (item: { to: string, matchPrefix?: string }) => {
  const prefix = item.matchPrefix ?? item.to
  if (item.to === '/') return route.path === '/'
  return route.path.startsWith(prefix)
}
</script>

<template>
  <nav
    v-if="authStore.isAuthenticated"
    class="bottom-nav-pill"
  >
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group"
      :class="[isActive(item) ? 'text-white' : 'text-neutral-400']"
    >
      <!-- Active indicator -->
      <div
        v-if="isActive(item)"
        class="absolute inset-x-1 inset-y-1 bg-secondary-500/15 dark:bg-secondary-400/20 rounded-[30px] z-0 transition-all duration-500"
      />

      <UIcon
        :name="item.icon"
        class="size-5 relative z-10 transition-transform"
        :class="[
          isActive(item)
            ? 'text-secondary-600 dark:text-secondary-400 scale-110'
            : ''
        ]"
      />
      <span
        class="text-[9px] font-bold tracking-widest relative z-10 mt-0.5"
        :class="[
          isActive(item)
            ? 'text-secondary-600 dark:text-secondary-400'
            : ''
        ]"
      >{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
