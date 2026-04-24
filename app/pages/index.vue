<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const appStore = useAppStore()
const groupContextStore = useGroupContextStore()
const toast = useToast()
const groupsComposable = useGroups(appStore.activeTournamentId)
const matchesComposable = useMatches(appStore.activeTournamentId)

const groups = groupsComposable.groups
const loadingGroups = groupsComposable.loading

const requestingBoardId = ref<string | null>(null)

onMounted(async () => {
  appStore.setPageTitle('Dashboard')
  await Promise.all([groupsComposable.loadGroups(), matchesComposable.loadAll()])

  // Auto-set context if not set but user has an active group
  if (!groupContextStore.hasContext && groups.value.length) {
    const activeGroup = groups.value.find(g => g.userBoardIsActive)
    if (activeGroup?.userBoardId) {
      groupContextStore.setContext({
        groupId: activeGroup.id,
        groupName: activeGroup.name,
        groupCode: activeGroup.code,
        boardId: activeGroup.userBoardId
      })
    }
  }
})

// Active context IDs
const activeGroupId = computed(() => groupContextStore.activeGroupId ?? '')
const firstActiveBoardId = computed(
  () =>
    groupContextStore.activeBoardId
    ?? groups.value.find(g => g.userBoardIsActive)?.userBoardId
    ?? null
)

// Positions for the active group
const { currentUserEntry, loading: loadingPositions } = usePositions(activeGroupId)

const heroPoints = computed(() => currentUserEntry.value?.totalPoints ?? null)
const heroRank = computed(() => currentUserEntry.value?.currentPos ?? null)

// Next scheduled match
const nextMatch = computed(() =>
  matchesComposable.matches.value.find(m => m.status === 'scheduled') ?? null
)

function formatMatchDate(date: Date): string {
  const now = new Date()
  const d = date
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `HOY • ${time}`
  const dayName = d.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase()
  return `${dayName} • ${time}`
}

async function handleRequestBoard(groupId: string) {
  requestingBoardId.value = groupId
  try {
    await groupsComposable.requestBoard(groupId, appStore.activeTournamentId)
    await groupsComposable.loadGroups()
  } finally {
    requestingBoardId.value = null
  }
}
</script>

<template>
  <div class="relative font-sans">
    <!-- Hero Header (Theme WC26) -->
    <div
      class="relative w-full h-[300px] rounded-b-[48px] overflow-hidden bg-gradient-to-b from-[#0a1028] to-[#1b2b66] dark:from-[#050815] dark:to-[#0f172a] px-6 pt-6"
    >
      <!-- Top nav row inside hero -->
      <div class="flex items-center justify-between pt-safe-top mt-2">
        <span
          class="text-white/90 text-xs font-black tracking-[0.2em] font-heading"
        >FIFA WORLD CUP 2026™</span>
        <button
          class="p-2 -mr-2 text-white hover:bg-white/10 rounded-full transition-colors"
          @click="toast.add({ title: 'Notificaciones', description: 'Próximamente disponible.', color: 'neutral' })"
        >
          <UIcon
            name="i-lucide-bell"
            class="size-5"
          />
        </button>
      </div>

      <!-- User Stat / Hero Points -->
      <div
        class="flex flex-col items-center justify-center mt-12 gap-1 stagger-up"
      >
        <template v-if="loadingPositions && heroPoints === null">
          <USkeleton class="h-14 w-32 rounded-xl bg-white/10" />
          <USkeleton class="h-4 w-48 rounded-full mt-2 bg-white/10" />
        </template>
        <template v-else-if="heroPoints !== null">
          <span
            class="text-white text-[56px] font-black font-heading leading-none drop-shadow-md tracking-tight"
          >
            {{ heroPoints.toLocaleString('es-MX') }}
          </span>
          <span
            class="text-secondary-400 text-[11px] font-bold tracking-widest mt-1 opacity-90 drop-shadow-sm"
          >
            PUNTOS{{ heroRank ? ` • RANGO #${heroRank}` : '' }}
          </span>
        </template>
        <template v-else>
          <!-- No active context yet: show welcome -->
          <span
            class="text-white text-[28px] font-black font-heading leading-tight text-center drop-shadow-md"
          >
            {{ authStore.displayName ? `Hola, ${authStore.displayName.split(' ')[0]}!` : 'Bienvenido' }}
          </span>
          <span
            class="text-white/60 text-[12px] font-bold tracking-widest mt-2 opacity-90 text-center"
          >
            ÚNETE A UNA LIGA PARA COMPETIR
          </span>
        </template>
      </div>
    </div>

    <!-- Main Stack -->
    <div class="relative z-10 -mt-20 px-4 sm:px-6 flex flex-col gap-8 pb-32">
      <!-- Feature: Next Match Block (Overlapping) -->
      <div class="stagger-up stagger-d2">
        <div
          class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[28px] p-6 lg:p-8 relative overflow-hidden group active:scale-[0.99] transition-all"
        >
          <!-- Loading state -->
          <template v-if="matchesComposable.loading.value">
            <div class="flex flex-col gap-4">
              <USkeleton class="h-4 w-24 rounded" />
              <USkeleton class="h-20 w-full rounded-xl" />
              <USkeleton class="h-14 w-full rounded-[20px]" />
            </div>
          </template>

          <!-- Next scheduled match -->
          <template v-else-if="nextMatch">
            <div class="flex flex-col gap-6">
              <!-- Header -->
              <div class="flex justify-between items-center">
                <span
                  class="text-error-600 text-[13px] font-black font-heading tracking-wide"
                >{{ formatMatchDate(nextMatch.date) }}</span>
                <span
                  class="text-neutral-500 dark:text-neutral-400 text-[12px] font-bold tracking-widest"
                >{{ nextMatch.phase }}</span>
              </div>

              <!-- Teams -->
              <div class="flex justify-between items-center px-4">
                <div class="flex flex-col items-center gap-3">
                  <MatchTeamLogo
                    :logo-url="nextMatch.localTeamLogo"
                    :name="nextMatch.localTeamName ?? '?'"
                    size="lg"
                  />
                  <span
                    class="text-2xl font-black font-heading text-neutral-800 dark:text-white leading-none"
                  >{{ nextMatch.localTeamName?.slice(0, 3).toUpperCase() ?? '???' }}</span>
                </div>

                <span
                  class="text-neutral-300 dark:text-neutral-600 text-[18px] font-black font-heading"
                >VS</span>

                <div class="flex flex-col items-center gap-3">
                  <MatchTeamLogo
                    :logo-url="nextMatch.visitorTeamLogo"
                    :name="nextMatch.visitorTeamName ?? '?'"
                    size="lg"
                  />
                  <span
                    class="text-2xl font-black font-heading text-neutral-800 dark:text-white leading-none"
                  >{{ nextMatch.visitorTeamName?.slice(0, 3).toUpperCase() ?? '???' }}</span>
                </div>
              </div>

              <!-- Action -->
              <UButton
                v-if="firstActiveBoardId"
                :to="`/board/${firstActiveBoardId}`"
                class="w-full bg-gradient-to-r from-error-600 to-error-800 hover:from-error-500 hover:to-error-700 h-14 rounded-[20px] text-white text-[14px] font-black tracking-wide font-heading shadow-lg shadow-error-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                HAZ TU PRONÓSTICO
              </UButton>
              <div
                v-else
                class="w-full bg-neutral-100 dark:bg-neutral-800 h-14 rounded-[20px] text-neutral-400 text-[14px] font-black tracking-wide font-heading flex items-center justify-center"
              >
                SIN TABLA ACTIVA
              </div>
            </div>
          </template>

          <!-- No upcoming matches — quick actions -->
          <template v-else>
            <p class="text-center text-sm text-neutral-500 dark:text-neutral-400 font-bold mb-4">
              No hay partidos próximos
            </p>
            <div class="grid grid-cols-2 gap-3">
              <UButton
                to="/matches"
                variant="soft"
                color="primary"
                block
                class="h-12 font-heading font-black tracking-wide text-[13px]"
              >
                VER PARTIDOS
              </UButton>
              <UButton
                to="/positions"
                variant="soft"
                color="secondary"
                block
                class="h-12 font-heading font-black tracking-wide text-[13px]"
              >
                RANKING
              </UButton>
            </div>
          </template>
        </div>
      </div>

      <!-- Tus Ligas -->
      <div class="flex flex-col gap-4 stagger-up stagger-d4">
        <div class="flex items-center justify-between px-2">
          <h3
            class="text-[14px] font-black text-neutral-500 dark:text-neutral-400 tracking-widest font-heading"
          >
            TUS LIGAS
          </h3>
          <NuxtLink
            to="/groups"
            class="text-[13px] font-bold text-primary-500 hover:text-primary-600 transition-colors"
          >
            Ver todas
          </NuxtLink>
        </div>

        <!-- Horizontal Scroll Snap Container -->
        <div
          class="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide"
        >
          <div
            v-if="loadingGroups"
            class="flex gap-4"
          >
            <USkeleton
              v-for="i in 2"
              :key="i"
              class="w-[160px] h-[160px] rounded-[20px] shrink-0"
            />
          </div>

          <template v-else-if="groups.length">
            <div
              v-for="group in groups"
              :key="group.id"
              class="shrink-0 w-[160px] bg-(--ui-bg-elevated) border border-(--ui-border) p-5 rounded-[20px] snap-center flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:shadow-md transition-shadow"
            >
              <div class="flex items-center gap-2 mb-4">
                <UIcon
                  name="i-lucide-users"
                  class="size-5 text-neutral-500 shrink-0"
                />
                <span
                  class="text-[13px] font-bold text-neutral-800 dark:text-white truncate"
                >{{ group.name }}</span>
              </div>

              <div class="flex-1" />

              <!-- Status badge -->
              <div class="mb-4">
                <span
                  v-if="group.userBoardIsActive"
                  class="inline-flex items-center gap-1.5 text-[11px] font-black text-secondary-600 dark:text-secondary-400"
                >
                  <span class="size-1.5 rounded-full bg-secondary-500 inline-block" />
                  ACTIVA
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 text-[11px] font-black text-neutral-400"
                >
                  <span class="size-1.5 rounded-full bg-neutral-400 inline-block" />
                  PENDIENTE
                </span>
              </div>

              <UButton
                v-if="group.userBoardIsActive"
                :to="`/board/${group.userBoardId}`"
                variant="soft"
                color="neutral"
                block
                size="xs"
                class="rounded-lg font-bold"
              >
                Ingresar
              </UButton>
              <UButton
                v-else
                variant="soft"
                color="primary"
                block
                size="xs"
                class="rounded-lg font-bold"
                :loading="requestingBoardId === group.id"
                @click="handleRequestBoard(group.id)"
              >
                Activar
              </UButton>
            </div>
          </template>

          <!-- Empty State -->
          <div
            v-else
            class="w-full flex flex-col items-center justify-center gap-3 p-8 bg-(--ui-bg-elevated) rounded-[20px] border border-(--ui-border) border-dashed"
          >
            <span class="text-sm font-bold text-neutral-400">Sin ligas activas</span>
            <UButton
              to="/groups"
              variant="soft"
              color="primary"
              size="sm"
              class="font-heading font-black tracking-wide text-[12px]"
            >
              UNIRSE A LIGA
            </UButton>
          </div>
        </div>
      </div>

      <!-- CTA: Ver Partidos -->
      <div class="flex flex-col gap-3 stagger-up stagger-d5 px-2">
        <h3
          class="text-[12px] font-black text-neutral-500 dark:text-neutral-400 tracking-wider font-heading"
        >
          ACCESOS RÁPIDOS
        </h3>

        <NuxtLink
          to="/matches"
          class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-[16px] p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.99] hover:border-(--ui-primary)/30 group"
        >
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <UIcon
                name="i-lucide-calendar"
                class="size-5 text-primary-500"
              />
            </div>
            <span class="font-heading font-black text-neutral-800 dark:text-white text-[15px] tracking-wide">
              Partidos
            </span>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 text-neutral-400 group-hover:text-primary-500 transition-colors"
          />
        </NuxtLink>

        <NuxtLink
          to="/positions"
          class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-[16px] p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.99] hover:border-(--ui-primary)/30 group"
        >
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-xl bg-secondary-500/10 flex items-center justify-center">
              <UIcon
                name="i-lucide-trophy"
                class="size-5 text-secondary-500"
              />
            </div>
            <span class="font-heading font-black text-neutral-800 dark:text-white text-[15px] tracking-wide">
              Tabla de Posiciones
            </span>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 text-neutral-400 group-hover:text-primary-500 transition-colors"
          />
        </NuxtLink>

        <NuxtLink
          to="/instructions"
          class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-[16px] p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.99] hover:border-(--ui-primary)/30 group"
        >
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-xl bg-error-500/10 flex items-center justify-center">
              <UIcon
                name="i-lucide-book-open"
                class="size-5 text-error-500"
              />
            </div>
            <span class="font-heading font-black text-neutral-800 dark:text-white text-[15px] tracking-wide">
              Reglas del Juego
            </span>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 text-neutral-400 group-hover:text-primary-500 transition-colors"
          />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
