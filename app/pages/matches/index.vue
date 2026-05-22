<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { Match, MatchPhase } from '~/types'
import { isMatchActive, isMatchClosed } from '~/types/match'

dayjs.locale('es')

definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()

const { matches, loading, error, loadAll } = useMatches(appStore.activeTournamentId)

onMounted(async () => {
  appStore.setPageTitle('Partidos')
  await loadAll()
})

const orderedPhases: MatchPhase[] = [
  'Fase de Grupos',
  'Dieciseisavos de Final',
  'Octavos de Final',
  'Cuartos de Final',
  'Semifinales',
  'Tercer Lugar',
  'Final'
]

const activePhase = ref<string>('Todos')

const phases = computed(() => {
  const presentPhases = new Set(matches.value.map(m => m.phase))
  const known = orderedPhases.filter(p => presentPhases.has(p))
  const unknown = Array.from(presentPhases).filter(p => !orderedPhases.includes(p))
  return ['Todos', ...known, ...unknown]
})

const statusFilters = ['Todos', 'En Vivo', 'Programados', 'Cerrados'] as const
type StatusFilter = typeof statusFilters[number]
const activeFilter = ref<StatusFilter>('Todos')

const filteredMatches = computed(() => {
  let list = [...matches.value]

  // Filtrar por fase
  if (activePhase.value !== 'Todos') {
    list = list.filter(m => m.phase === activePhase.value)
  }

  // Filtrar por estado
  if (activeFilter.value === 'En Vivo') {
    list = list.filter(m => isMatchActive(m))
  } else if (activeFilter.value === 'Programados') {
    list = list.filter(m => !isMatchActive(m) && !isMatchClosed(m))
  } else if (activeFilter.value === 'Cerrados') {
    list = list.filter(m => isMatchClosed(m))
  }

  // Ordenar
  return list.sort((a, b) => {
    const da = dayjs(a.date)
    const db = dayjs(b.date)
    // Active first, then scheduled, then closed
    if (isMatchActive(a) && !isMatchActive(b)) return -1
    if (!isMatchActive(a) && isMatchActive(b)) return 1
    if (!isMatchClosed(a) && isMatchClosed(b)) return -1
    if (isMatchClosed(a) && !isMatchClosed(b)) return 1
    return da.valueOf() - db.valueOf()
  })
})

function formatDate(date: Date) {
  return dayjs(date).format('ddd D MMM · HH:mm')
}

function getStatusLabel(match: Match) {
  if (isMatchClosed(match)) return 'Finalizado'
  if (isMatchActive(match)) return 'EN VIVO'
  return formatDate(match.date)
}
</script>

<template>
  <div class="font-sans">
    <!-- Header con gradiente tri-color -->
    <LayoutPageHeader
      title="Partidos"
      subtitle="Resultados y marcadores del torneo"
    />

    <div class="p-4 space-y-4 pb-24">
      <!-- Filtros de búsqueda (Fase y Estado) -->
      <div class="space-y-2">
        <!-- Filtro por Fases -->
        <div
          v-if="phases.length > 2"
          class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide stagger-up stagger-d1"
        >
          <button
            v-for="phase in phases"
            :key="phase"
            class="px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap
                   transition-all duration-200 uppercase tracking-wider"
            :class="[
              activePhase === phase
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'bg-(--ui-bg-muted) text-(--ui-text-muted) hover:bg-(--ui-bg-muted)/80'
            ]"
            @click="activePhase = phase"
          >
            {{ phase }}
          </button>
        </div>

        <!-- Filtro por Estado -->
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
        v-else-if="error"
        class="text-center py-12 stagger-up"
      >
        <div class="size-16 bg-error-50 dark:bg-error-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-error-200 dark:border-error-800">
          <UIcon
            name="i-lucide-wifi-off"
            class="size-8 text-error-500"
          />
        </div>
        <p class="font-heading text-base font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
          No pudimos cargar los partidos
        </p>
        <p class="text-sm text-(--ui-text-muted) mt-1">
          {{ error }}
        </p>
        <UButton
          class="mt-4"
          color="primary"
          variant="soft"
          size="sm"
          @click="loadAll"
        >
          Reintentar
        </UButton>
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
          <div class="card-elevated overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <!-- Header de la card -->
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
              <span class="font-heading text-[10px] font-black text-primary-500 dark:text-primary-400 uppercase tracking-widest">
                {{ match.phase }}
              </span>
              <div class="flex items-center gap-2">
                <span
                  v-if="isMatchActive(match)"
                  class="live-indicator"
                />
                <span
                  class="text-[11px] font-bold uppercase tracking-wider"
                  :class="isMatchActive(match) ? 'text-error-500' : 'text-(--ui-text-muted)'"
                >
                  {{ getStatusLabel(match) }}
                </span>
              </div>
            </div>

            <!-- Equipos -->
            <div class="flex items-center gap-3 px-4 pb-4">
              <!-- Equipo local -->
              <div class="flex-1 flex flex-col items-center gap-2">
                <MatchTeamLogo
                  :logo-url="match.localTeamLogo"
                  :name="match.localTeamName ?? ''"
                  size="lg"
                />
                <span class="text-xs font-heading font-black text-(--ui-text-highlighted) text-center leading-tight line-clamp-2 uppercase tracking-wide">
                  {{ match.localTeamName ?? 'TBD' }}
                </span>
              </div>

              <!-- Marcador / VS -->
              <div class="flex flex-col items-center gap-1 shrink-0 min-w-[60px]">
                <div
                  v-if="isMatchClosed(match) || isMatchActive(match)"
                  class="score-pill inline-flex items-center justify-center"
                >
                  {{ match.localGoals ?? '-' }} - {{ match.visitorGoals ?? '-' }}
                </div>
                <span
                  v-else
                  class="font-heading text-sm font-black text-(--ui-text-muted) tracking-widest"
                >
                  VS
                </span>
                <span class="text-[9px] text-(--ui-text-muted) font-mono uppercase tracking-widest">
                  #{{ match.matchNumber }}
                </span>
              </div>

              <!-- Equipo visitante -->
              <div class="flex-1 flex flex-col items-center gap-2">
                <MatchTeamLogo
                  :logo-url="match.visitorTeamLogo"
                  :name="match.visitorTeamName ?? ''"
                  size="lg"
                />
                <span class="text-xs font-heading font-black text-(--ui-text-highlighted) text-center leading-tight line-clamp-2 uppercase tracking-wide">
                  {{ match.visitorTeamName ?? 'TBD' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-center py-12 stagger-up"
      >
        <div class="size-16 bg-(--ui-bg-elevated) rounded-full flex items-center justify-center mx-auto mb-4 border border-(--ui-border)">
          <UIcon
            name="i-lucide-trophy"
            class="size-8 text-(--ui-text-muted)"
          />
        </div>
        <p class="font-heading text-base font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
          Sin partidos
        </p>
        <p class="text-sm text-(--ui-text-muted) mt-1">
          No hay partidos en esta categoría.
        </p>
      </div>
    </div>
  </div>
</template>
