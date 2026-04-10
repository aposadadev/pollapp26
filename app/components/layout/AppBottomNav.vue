<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const groupContextStore = useGroupContextStore()

const navItems = computed(() => {
  const base = [
    { to: '/', label: 'INICIO', icon: 'i-lucide-house', show: true }
  ]

  const contextual = groupContextStore.hasContext
    ? [
        {
          to: `/board/${groupContextStore.activeBoardId}`,
          label: 'TABLA',
          icon: 'i-lucide-clipboard-list',
          show: authStore.isAuthenticated,
          exact: false
        },
        {
          to: `/groups/${groupContextStore.activeGroupId}/positions`,
          label: 'RANKING',
          icon: 'i-lucide-trophy',
          show: authStore.isAuthenticated,
          exact: false
        }
      ]
    : []

  const extra = [
    {
      to: '/groups',
      label: 'LIGAS',
      icon: 'i-lucide-layout-grid',
      show: authStore.isAuthenticated
    },
    {
      to: '/instructions',
      label: 'REGLAS',
      icon: 'i-lucide-book-open',
      show: authStore.isAuthenticated
    },
    {
      to: '/admin',
      label: 'ADMIN',
      icon: 'i-lucide-shield-check',
      show: authStore.isAuthenticated && authStore.isAdmin
    }
  ]

  return [...base, ...contextual, ...extra].filter(i => i.show)
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    v-if="authStore.isAuthenticated"
    class="bottom-nav-pill"
  >
    <template
      v-for="item in navItems"
      :key="item.to"
    >
      <NuxtLink
        :to="item.to"
        class="flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group"
        :class="[isActive(item.to) ? 'text-white' : 'text-neutral-400']"
      >
        <!-- Active indicator -->
        <div
          v-if="isActive(item.to)"
          class="absolute inset-x-2 inset-y-1 bg-secondary-500/10 dark:bg-secondary-400/20 rounded-[30px] z-0 transition-all duration-500"
        />

        <UIcon
          :name="item.icon"
          class="size-5 relative z-10 transition-transform"
          :class="[
            isActive(item.to)
              ? 'text-secondary-600 dark:text-secondary-400 scale-110'
              : ''
          ]"
        />
        <span
          class="text-[9px] font-bold tracking-widest relative z-10 mt-0.5"
          :class="[
            isActive(item.to)
              ? 'text-secondary-600 dark:text-secondary-400'
              : ''
          ]"
        >{{ item.label }}</span>
      </NuxtLink>
    </template>
  </nav>
</template>
