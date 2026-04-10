<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { mundial2026 } from '~/config/tournaments/mundial2026'
import type { Match } from '~/types'

dayjs.locale('es')

definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
onMounted(() => appStore.setPageTitle('Partidos'))

const { matches, loading, loadAll } = useMatches(mundial2026.id)

onMounted(async () => {
  await loadAll()
})

const statusFilters = ['Todos', 'En Vivo', 'Programados', 'Cerrados'] as const
type StatusFilter = typeof statusFilters[number]
const activeFilter = ref<StatusFilter>('Todos')

const filteredMatches = computed(() => {
  const sorted = [...matches.value].sort((a, b) => {
    const da = dayjs(a.date)
    const db = dayjs(b.date)
    // Active first, then scheduled, then closed
    if (a.isActive && !b.isActive) return -1
    if (!a.isActive && b.isActive) return 1
    if (!a.isClosed && b.isClosed) return -1
    if (a.isClosed && !b.isClosed) return 1
    return da.valueOf() - db.valueOf()
  })

  if (activeFilter.value === 'En Vivo') return sorted.filter(m => m.isActive && !m.isClosed)
  if (activeFilter.value === 'Programados') return sorted.filter(m => !m.isActive && !m.isClosed)
  if (activeFilter.value === 'Cerrados') return sorted.filter(m => m.isClosed)
  return sorted
})

function formatDate(date: Date) {
  return dayjs(date).format('ddd D MMM · HH:mm')
}

function getStatusLabel(match: Match) {
  if (match.isClosed) return 'Finalizado'
  if (match.isActive) return 'EN VIVO'
  return formatDate(match.date)
}
</script>

<template>
  <div>
    <!-- Header con gradiente tri-color -->
    <LayoutPageHeader
      title="Partidos"
      subtitle="Resultados y marcadores del torneo"
    />

    <div class="p-4 space-y-4 pb-24">
      <!-- Filter chips -->
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide stagger-up stagger-d1">
        <button
          v-for="filter in statusFilters"
          :key="filter"
          class="px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap
                 transition-all duration-200 uppercase tracking-wider"
          :class="[
            activeFilter === filter
              ? 'gradient-tricolor text-white shadow-md'
              : 'bg-(--ui-bg-muted) text-(--ui-text-muted) hover:bg-(--ui-bg-muted)/80'
          ]"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <!-- Lista de partidos -->
      <div
        v-if="loading"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-32 rounded-xl"
        />
      </div>

      <div
        v-else-if="filteredMatches.length"
        class="space-y-3"
      >
        <div
          v-for="(match, i) in filteredMatches"
          :key="match.id"
          class="stagger-left"
          :class="`stagger-d${Math.min(i + 2, 12)}`"
        >
          <UCard class="overflow-hidden transition-all duration-200 hover:shadow-md">
            <template #header>
              <div class="flex items-center justify-between text-xs text-(--ui-text-muted)">
                <span class="font-heading uppercase tracking-wider">{{ match.phase }}</span>
                <span
                  :class="match.isActive && !match.isClosed
                    ? 'live-indicator'
                    : ''"
                >
                  <template v-if="match.isActive && !match.isClosed">
                    🔴 {{ getStatusLabel(match) }}
                  </template>
                  <template v-else>
                    {{ getStatusLabel(match) }}
                  </template>
                </span>
              </div>
            </template>

            <!-- Equipos -->
            <div class="flex items-center gap-3">
              <!-- Equipo local -->
              <div class="flex-1 flex flex-col items-center gap-2">
                <MatchTeamLogo
                  :logo-url="match.localTeamLogo"
                  :name="match.localTeamName ?? ''"
                  size="lg"
                />
                <span class="text-xs font-heading font-semibold text-(--ui-text-highlighted) text-center leading-tight line-clamp-2 uppercase tracking-wide">
                  {{ match.localTeamName ?? 'TBD' }}
                </span>
              </div>

              <!-- Marcador -->
              <div class="flex flex-col items-center gap-1 shrink-0">
                <div
                  v-if="match.isClosed || match.isActive"
                  class="score-pill"
                >
                  <span class="font-heading text-lg font-bold text-(--ui-text-highlighted)">
                    {{ match.localGoals ?? '-' }}
                  </span>
                  <span class="text-xs text-(--ui-text-muted) mx-1">-</span>
                  <span class="font-heading text-lg font-bold text-(--ui-text-highlighted)">
                    {{ match.visitorGoals ?? '-' }}
                  </span>
                </div>
                <span
                  v-else
                  class="font-heading text-xs font-bold text-(--ui-text-muted) tracking-widest"
                >
                  VS
                </span>
              </div>

              <!-- Equipo visitante -->
              <div class="flex-1 flex flex-col items-center gap-2">
                <MatchTeamLogo
                  :logo-url="match.visitorTeamLogo"
                  :name="match.visitorTeamName ?? ''"
                  size="lg"
                />
                <span class="text-xs font-heading font-semibold text-(--ui-text-highlighted) text-center leading-tight line-clamp-2 uppercase tracking-wide">
                  {{ match.visitorTeamName ?? 'TBD' }}
                </span>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <div
        v-else
        class="text-center py-10"
      >
        <UIcon
          name="i-lucide-trophy"
          class="size-12 text-(--ui-text-muted) mx-auto mb-3"
        />
        <p class="text-sm text-(--ui-text-muted)">
          No hay partidos en esta categoría.
        </p>
      </div>
    </div>
  </div>
</template>
