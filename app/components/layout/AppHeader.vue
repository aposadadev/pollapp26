<script setup lang="ts">
const authStore = useAuthStore()
const colorMode = useColorMode()
const { logout } = useAuth()

const pickerOpen = ref(false)

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val) => {
    colorMode.preference = val ? 'dark' : 'light'
  }
})

const userMenuItems = computed(() => [
  [
    {
      label: authStore.displayName ?? authStore.user?.email ?? 'Usuario',
      icon: 'i-lucide-user-circle',
      disabled: true
    }
  ],
  [
    {
      label: 'Reglamento',
      icon: 'i-lucide-book-open',
      to: '/instructions'
    }
  ],
  [
    {
      label: 'Cerrar sesión',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: logout
    }
  ]
])
</script>

<template>
  <div>
    <header
      class="fixed top-0 inset-x-0 z-40 h-[var(--app-header-height)] bg-(--ui-bg)/80 backdrop-blur-md border-b border-(--ui-border)/50 shadow-sm flex items-center justify-between px-4 transition-all duration-300"
    >
      <!-- Logo + Group Context Switcher -->
      <div class="flex items-center gap-2 min-w-0">
        <NuxtLink
          to="/"
          class="shrink-0 group"
          aria-label="Inicio"
        >
          <div
            class="size-8 rounded-xl gradient-tricolor flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105"
          >
            <UIcon
              name="i-lucide-trophy"
              class="size-4 text-white"
            />
          </div>
        </NuxtLink>

        <!-- Switcher solo cuando está autenticado -->
        <LayoutGroupContextSwitcher
          v-if="authStore.isAuthenticated"
          @open-picker="pickerOpen = true"
        />
      </div>

      <!-- Acciones derecha -->
      <div class="flex items-center gap-1">
        <!-- Admin -->
        <NuxtLink
          v-if="authStore.isAdmin"
          to="/admin"
          class="p-2 rounded-xl text-(--ui-text-muted) hover:text-(--ui-text) hover:bg-(--ui-bg-muted) transition-all duration-200"
          aria-label="Panel Admin"
        >
          <UIcon
            name="i-lucide-settings"
            class="size-4"
          />
        </NuxtLink>

        <!-- Dark mode -->
        <ClientOnly>
          <button
            class="p-2 rounded-xl text-(--ui-text-muted) hover:text-(--ui-text) hover:bg-(--ui-bg-muted) transition-all duration-200"
            aria-label="Cambiar modo de color"
            @click="isDark = !isDark"
          >
            <UIcon
              :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
              class="size-4 transition-transform duration-300"
              :class="isDark ? 'rotate-0' : 'rotate-180'"
            />
          </button>
        </ClientOnly>

        <!-- Avatar / Menú de usuario -->
        <UDropdownMenu
          v-if="authStore.isAuthenticated"
          :items="userMenuItems"
          :ui="{ content: 'w-48' }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            class="flex items-center gap-1.5 text-xs font-medium"
            aria-label="Menú de usuario"
          >
            <UIcon
              name="i-lucide-user-circle"
              class="size-4"
            />
            <span class="hidden sm:block max-w-24 truncate">{{
              authStore.displayName ?? "Usuario"
            }}</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-3 text-(--ui-text-muted)"
            />
          </UButton>
        </UDropdownMenu>
      </div>
    </header>

    <!-- Group Context Picker (bottom sheet) -->
    <LayoutGroupContextPicker v-model="pickerOpen" />
  </div>
</template>
