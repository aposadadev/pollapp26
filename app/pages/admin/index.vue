<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
const {
  matches: allMatches,
  loadAll
} = useMatches(appStore.activeTournamentId)

const stats = computed(() => {
  const total = allMatches.value.length
  const closed = allMatches.value.filter(m => m.isClosed).length
  const active = allMatches.value.filter(m => m.isActive).length
  const scheduled = total - closed - active
  return { total, closed, active, scheduled }
})

onMounted(async () => {
  appStore.setPageTitle('Panel Admin')
  await loadAll()
})

const adminActions = [
  {
    to: '/admin/groups',
    label: 'Gestionar Grupos',
    icon: 'i-lucide-users',
    color: 'bg-secondary-500/10 text-secondary-600',
    description: 'Tablas pendientes y nuevos grupos'
  },
  {
    to: '/admin/matches',
    label: 'Cerrar Partidos',
    icon: 'i-lucide-trophy',
    color: 'bg-primary-500/10 text-primary-600',
    description: 'Resultados finales y puntajes'
  },
  {
    to: '/admin/teams',
    label: 'Equipos y Sedes',
    icon: 'i-lucide-shield-check',
    color: 'bg-secondary-500/10 text-secondary-600',
    description: 'Configuración de participantes'
  }
]
</script>

<template>
  <div class="space-y-0 pb-20 font-sans relative">
    <LayoutPageHeader
      title="PANEL ADMIN"
      :subtitle="`TORNEO: ${mundial2026.name}`"
    />

    <div class="relative z-10 -mt-16 px-4 sm:px-6 flex flex-col gap-8 pb-32">
      <!-- Admin Stats Overlapping Card -->
      <div class="stagger-up stagger-d2">
        <div
          class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[28px] p-6 lg:p-8 w-full flex flex-col gap-4"
        >
          <span
            class="text-[11px] font-black tracking-[0.2em] font-heading text-neutral-400 uppercase"
          >Vista General</span>

          <div class="grid grid-cols-2 gap-4">
            <div
              class="flex flex-col items-center justify-center p-4 bg-primary-600 rounded-[20px] text-white shadow-lg shadow-primary-600/20"
            >
              <span class="text-[32px] font-black font-heading leading-none">{{
                stats.total
              }}</span>
              <span
                class="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1"
              >Total</span>
            </div>
            <div
              class="flex flex-col items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-800 rounded-[20px] text-neutral-800 dark:text-white"
            >
              <span class="text-[32px] font-black font-heading leading-none">{{
                stats.scheduled
              }}</span>
              <span
                class="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-1"
              >Programados</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions List -->
      <div class="flex flex-col gap-4 stagger-up stagger-d4 mt-2">
        <h3
          class="text-[14px] font-black text-neutral-500 dark:text-neutral-400 tracking-widest font-heading px-2"
        >
          ACCIONES ADMINISTRATIVAS
        </h3>

        <div class="grid gap-4">
          <NuxtLink
            v-for="action in adminActions"
            :key="action.to"
            :to="action.to"
            class="group bg-(--ui-bg-elevated) border border-(--ui-border) rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center gap-5 cursor-pointer outline-none hover:border-(--ui-primary)/30"
          >
            <div
              :class="[
                'size-14 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110',
                action.color
              ]"
            >
              <UIcon
                :name="action.icon"
                class="size-7"
              />
            </div>
            <div class="flex-1">
              <h4
                class="font-bold text-lg font-heading text-neutral-800 dark:text-white leading-tight uppercase tracking-wide"
              >
                {{ action.label }}
              </h4>
              <p
                class="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5"
              >
                {{ action.description }}
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-6 text-(--ui-border) group-hover:text-(--ui-primary) transition-colors"
            />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
