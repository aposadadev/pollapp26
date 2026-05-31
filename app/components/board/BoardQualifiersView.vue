<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { teamRepository } from '~/repositories/team.repository'
import { matchRepository } from '~/repositories/match.repository'
import { qualifierService } from '~/services/qualifier.service'
import type { Team, Match, QualifierPhase, QualifierConfig, QualifierPrediction, Board } from '~/types'
import { TEAM_GROUPS } from '~/constants/teams'

interface Props {
  boardId: string
  board: Board | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const appStore = useAppStore()
const authStore = useAuthStore()

const toast = useToast()

const activeTab = ref<QualifierPhase>('dieciseisavos')
const teams = ref<Team[]>([])
const matches = ref<Match[]>([])
const loading = ref(true)
const saving = ref(false)

const config = ref<QualifierConfig | null>(null)
const userPrediction = ref<QualifierPrediction | null>(null)

// Copia local para editar
const localPredictions = ref<Record<QualifierPhase, string[]>>({
  dieciseisavos: [],
  octavos: [],
  cuartos: [],
  semifinales: [],
  final: [],
  tercer_lugar: [],
  campeon: []
})

const tabs: Array<{ value: QualifierPhase, label: string, limit: number }> = [
  { value: 'dieciseisavos', label: '16vos (32)', limit: 32 },
  { value: 'octavos', label: '8vos (16)', limit: 16 },
  { value: 'cuartos', label: '4tos (8)', limit: 8 },
  { value: 'semifinales', label: 'Semis (4)', limit: 4 },
  { value: 'final', label: 'Final (2)', limit: 2 },
  { value: 'tercer_lugar', label: '3er Lugar (1)', limit: 1 },
  { value: 'campeon', label: 'Campeón (1)', limit: 1 }
]

onMounted(async () => {
  try {
    const [teamsData, matchesData, configData, predData] = await Promise.all([
      teamRepository.findAll(),
      matchRepository.findByTournament(appStore.activeTournamentId),
      qualifierService.getConfig(),
      qualifierService.getPredictions(props.boardId)
    ])

    teams.value = teamsData.filter(t => t.shortName !== 'TBD')
    matches.value = matchesData
    config.value = configData
    userPrediction.value = predData

    if (predData) {
      localPredictions.value = {
        dieciseisavos: [...(predData.predictions.dieciseisavos ?? [])],
        octavos: [...(predData.predictions.octavos ?? [])],
        cuartos: [...(predData.predictions.cuartos ?? [])],
        semifinales: [...(predData.predictions.semifinales ?? [])],
        final: [...(predData.predictions.final ?? [])],
        tercer_lugar: [...(predData.predictions.tercer_lugar ?? [])],
        campeon: [...(predData.predictions.campeon ?? [])]
      }
    }
  } catch (err) {
    console.error('Error cargando datos de clasificatorios:', err)
  } finally {
    loading.value = false
  }
})

const isReadonly = computed(() => {
  if (!props.board) return true
  return props.board.userId !== authStore.user?.id
})

const enabledTabs = computed(() => {
  return tabs.filter((t) => {
    if (t.value === 'dieciseisavos') return true

    const phaseMap: Record<QualifierPhase, string> = {
      dieciseisavos: 'Fase de Grupos',
      octavos: 'Dieciseisavos de Final',
      cuartos: 'Octavos de Final',
      semifinales: 'Cuartos de Final',
      final: 'Semifinales',
      tercer_lugar: 'Tercer Lugar',
      campeon: 'Final'
    }
    const matchPhase = phaseMap[t.value]
    const phaseMatches = matches.value.filter(m => m.phase === matchPhase)
    if (phaseMatches.length === 0) return false

    return phaseMatches.every(m =>
      m.localTeamId
      && m.visitorTeamId
      && teams.value.some(t => t.id === m.localTeamId)
      && teams.value.some(t => t.id === m.visitorTeamId)
    )
  })
})

// Fecha límite de la fase activa
const phaseDeadline = computed(() => {
  if (!config.value) return null
  const dl = config.value.deadlines[activeTab.value]
  return dl ? new Date(dl) : null
})

const isDeadlinePassed = computed(() => {
  if (!phaseDeadline.value) return false
  return new Date() > phaseDeadline.value
})

const isLocked = computed(() => {
  return isReadonly.value
})

const formattedDeadline = computed(() => {
  if (!phaseDeadline.value) return ''
  return dayjs(phaseDeadline.value).format('DD MMM, YYYY - HH:mm [hs]')
})

// Equipos organizados por grupo para el tab "dieciseisavos"
const groupTeams = computed(() => {
  const groups: Record<string, Team[]> = {}
  for (const team of teams.value) {
    const grp = TEAM_GROUPS[team.name] || 'Otros'
    if (!groups[grp]) groups[grp] = []
    groups[grp].push(team)
  }
  // Ordenar los grupos alfabéticamente (A, B, C...)
  const sortedKeys = Object.keys(groups).sort()
  const sortedGroups: Record<string, Team[]> = {}
  for (const key of sortedKeys) {
    sortedGroups[key] = groups[key] ?? []
  }
  return sortedGroups
})

// Partidos del tab/fase activa (llaves)
const phaseMatches = computed(() => {
  const phaseMap: Record<QualifierPhase, string> = {
    dieciseisavos: 'Fase de Grupos', // No usado para partidos
    octavos: 'Dieciseisavos de Final',
    cuartos: 'Octavos de Final',
    semifinales: 'Cuartos de Final',
    final: 'Semifinales',
    tercer_lugar: 'Tercer Lugar',
    campeon: 'Final'
  }
  const matchPhase = phaseMap[activeTab.value]
  return matches.value.filter(m => m.phase === matchPhase)
})

// Cuenta de seleccionados actuales en la fase
const currentSelectionCount = computed(() => {
  return localPredictions.value[activeTab.value]?.length ?? 0
})

const currentLimit = computed(() => {
  return tabs.find(t => t.value === activeTab.value)?.limit ?? 0
})

const isSelectionChanged = computed(() => {
  const current = localPredictions.value[activeTab.value] ?? []
  const saved = userPrediction.value?.predictions[activeTab.value] ?? []
  if (current.length !== saved.length) return true
  return !current.every(id => saved.includes(id))
})

// Puntos obtenidos por el usuario en la fase actual
const phasePoints = computed(() => {
  if (!userPrediction.value || !config.value) return 0
  return userPrediction.value.points[activeTab.value] ?? 0
})

const phaseActualCount = computed(() => {
  if (!config.value) return 0
  return config.value.actualQualifiers[activeTab.value]?.length ?? 0
})

// Control de selección en Dieciseisavos
function toggleDieciseisavosTeam(team: Team) {
  if (isLocked.value) return

  const list = [...localPredictions.value.dieciseisavos]
  const idx = list.indexOf(team.id)

  if (idx > -1) {
    // Quitar de la selección
    list.splice(idx, 1)
    localPredictions.value.dieciseisavos = list
  } else {
    // Validar límite total
    if (list.length >= 32) {
      toast.add({
        title: 'Límite alcanzado',
        description: 'Ya has seleccionado los 32 equipos clasificados.',
        color: 'warning'
      })
      return
    }

    // Validar límite de 3 por grupo
    const teamGroup = TEAM_GROUPS[team.name]
    if (teamGroup) {
      const currentInGroup = list.filter((id) => {
        const t = teams.value.find(x => x.id === id)
        return t && TEAM_GROUPS[t.name] === teamGroup
      }).length

      if (currentInGroup >= 3) {
        toast.add({
          title: 'Límite de grupo',
          description: `Solo puedes elegir un máximo de 3 equipos del Grupo ${teamGroup}.`,
          color: 'warning'
        })
        return
      }
    }

    list.push(team.id)
    localPredictions.value.dieciseisavos = list
  }
}

// Control de selección por llave (Knockout phases)
function selectMatchWinner(match: Match, teamId: string) {
  if (isLocked.value) return
  if (!teamId || teamId === 'tbd') return

  const phase = activeTab.value
  const list = [...localPredictions.value[phase]]

  // Encontrar si ya hay un equipo seleccionado de esta misma llave/partido.
  // Para las fases por llaves, cada partido provee exactamente 1 clasificado a la lista.
  const localId = match.localTeamId
  const visitorId = match.visitorTeamId

  // Quitar el equipo local o visitante de este partido si ya estaban en la lista
  const cleaned = list.filter(id => id !== localId && id !== visitorId)

  // Agregar el nuevo ganador elegido
  cleaned.push(teamId)
  localPredictions.value[phase] = cleaned
}

function getSelectedWinnerInMatch(match: Match): string | null {
  const list = localPredictions.value[activeTab.value] ?? []
  if (list.includes(match.localTeamId)) return match.localTeamId
  if (list.includes(match.visitorTeamId)) return match.visitorTeamId
  return null
}

function isTeamCorrect(phase: QualifierPhase, teamId: string): boolean {
  if (!config.value) return false
  const actual = config.value.actualQualifiers[phase] ?? []
  return actual.includes(teamId)
}

function isTeamIncorrect(phase: QualifierPhase, teamId: string): boolean {
  if (!config.value) return false
  const actual = config.value.actualQualifiers[phase] ?? []
  const limit = tabs.find(t => t.value === phase)?.limit ?? 0
  if (actual.length < limit) return false
  return !actual.includes(teamId)
}

async function handleSave() {
  if (isLocked.value || saving.value) return

  // Validar fecha límite al darle al botón guardar
  if (isDeadlinePassed.value) {
    toast.add({
      title: 'Fase cerrada',
      description: 'El tiempo límite para realizar pronósticos en esta fase ha expirado.',
      color: 'error'
    })
    return
  }

  saving.value = true
  try {
    await qualifierService.savePhasePrediction(
      props.boardId,
      authStore.user!.id,
      appStore.activeTournamentId,
      activeTab.value,
      localPredictions.value[activeTab.value]
    )

    toast.add({
      title: 'Pronóstico guardado',
      description: 'Tu predicción de clasificación se ha guardado correctamente.',
      color: 'success'
    })

    // Recargar datos
    const predData = await qualifierService.getPredictions(props.boardId)
    userPrediction.value = predData
    emit('saved')
  } catch (err: unknown) {
    const error = err as Error
    toast.add({
      title: 'Error al guardar',
      description: error.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Navegación de Fases -->
    <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-(--ui-border) stagger-up">
      <button
        v-for="t in enabledTabs"
        :key="t.value"
        type="button"
        class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all shrink-0 active:scale-95 cursor-pointer"
        :class="[
          activeTab === t.value
            ? 'border-primary-500 bg-primary-500 text-white shadow-md'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text-muted) hover:border-(--ui-border-muted)'
        ]"
        @click="activeTab = t.value"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Banner de Información/Estatus -->
    <div
      class="card-elevated border border-(--ui-border) p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 stagger-up stagger-d1"
    >
      <div class="space-y-1">
        <h3 class="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <UIcon
            v-if="isDeadlinePassed"
            name="i-lucide-lock"
            class="size-4 text-error-500"
          />
          <UIcon
            v-else
            name="i-lucide-calendar-clock"
            class="size-4 text-primary-500"
          />
          Tiempo Límite:
          <span :class="isDeadlinePassed ? 'text-error-500 font-extrabold' : 'text-neutral-500 font-bold'">
            {{ isDeadlinePassed ? 'EXPIRADO' : formattedDeadline }}
          </span>
        </h3>
        <p class="text-xs text-neutral-400">
          {{ activeTab === 'dieciseisavos'
            ? 'Selecciona los 32 equipos que avanzarán de la Fase de Grupos.'
            : 'Selecciona al ganador de cada llave para avanzar a la siguiente ronda.'
          }}
        </p>
      </div>

      <!-- Badge de puntos reales -->
      <div
        v-if="phaseActualCount > 0 && userPrediction"
        class="flex items-center gap-2 self-start sm:self-center"
      >
        <UBadge
          color="success"
          variant="soft"
          size="md"
          class="font-black px-3 py-1 uppercase tracking-wider rounded-lg"
        >
          Adivinados: {{ phasePoints }} de {{ currentSelectionCount }} (+{{ phasePoints }} pts)
        </UBadge>
      </div>
    </div>

    <!-- Indicador de progreso local de selección -->
    <div
      v-if="!isLocked"
      class="flex items-center justify-between px-2 stagger-up stagger-d2"
    >
      <span class="text-xs font-black uppercase tracking-wider text-neutral-500">
        Tu Selección: {{ currentSelectionCount }} / {{ currentLimit }}
      </span>
      <span
        v-if="currentSelectionCount < currentLimit"
        class="text-xs font-bold text-amber-500 animate-pulse"
      >
        Faltan {{ currentLimit - currentSelectionCount }} por elegir
      </span>
      <span
        v-else
        class="text-xs font-bold text-emerald-500"
      >
        ¡Selección completa!
      </span>
    </div>

    <!-- Vista: Dieciseisavos (Por Grupos) -->
    <div
      v-if="activeTab === 'dieciseisavos'"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-up stagger-d3"
    >
      <div
        v-for="(grpTeams, grpName) in groupTeams"
        :key="grpName"
        class="card-elevated border border-(--ui-border) p-4 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
          <span class="font-heading font-black text-sm text-primary-500 dark:text-primary-400">
            Grupo {{ grpName }}
          </span>
          <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Elegidos: {{ grpTeams.filter(t => localPredictions.dieciseisavos.includes(t.id)).length }} / 3
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <button
            v-for="team in grpTeams"
            :key="team.id"
            type="button"
            class="flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group/btn cursor-pointer"
            :class="[
              localPredictions.dieciseisavos.includes(team.id)
                ? isTeamCorrect('dieciseisavos', team.id)
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isTeamIncorrect('dieciseisavos', team.id)
                    ? 'border-error-500 bg-error-500/10 text-error-600 dark:text-error-400'
                    : 'border-secondary-500 bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 font-extrabold'
                : 'border-(--ui-border) bg-(--ui-bg-elevated) text-neutral-800 dark:text-neutral-200 hover:border-neutral-400',
              isLocked ? 'opacity-85 pointer-events-none' : 'active:scale-[0.98]'
            ]"
            @click="toggleDieciseisavosTeam(team)"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <MatchTeamLogo
                :logo-url="team.logoUrl"
                :name="team.name"
                size="sm"
                class="shrink-0"
              />
              <span class="text-xs font-bold uppercase tracking-wide truncate">
                {{ team.name }}
              </span>
            </div>

            <!-- Icono/Estado -->
            <div class="flex items-center gap-1.5 shrink-0">
              <UIcon
                v-if="localPredictions.dieciseisavos.includes(team.id) && isTeamCorrect('dieciseisavos', team.id)"
                name="i-lucide-circle-check"
                class="size-4.5 text-emerald-500"
              />
              <UIcon
                v-else-if="localPredictions.dieciseisavos.includes(team.id) && isTeamIncorrect('dieciseisavos', team.id)"
                name="i-lucide-circle-x"
                class="size-4.5 text-error-500"
              />
              <UIcon
                v-else-if="localPredictions.dieciseisavos.includes(team.id)"
                name="i-lucide-check-circle-2"
                class="size-4.5 text-secondary-500"
              />
              <UIcon
                v-else-if="!isLocked"
                name="i-lucide-circle"
                class="size-4.5 text-neutral-300 dark:text-neutral-700 group-hover/btn:text-neutral-400 transition-colors"
              />
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Vista: Fases Eliminatorias (Por Llaves/Partidos) -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-up stagger-d3"
    >
      <div
        v-for="match in phaseMatches"
        :key="match.id"
        class="card-elevated border border-(--ui-border) p-4 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
          <span class="text-[10px] font-black text-primary-500 dark:text-primary-400 uppercase tracking-widest">
            Llave #{{ match.matchNumber }}
          </span>
          <span
            v-if="match.localTeamName === 'TBD' || match.visitorTeamName === 'TBD'"
            class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 tracking-wider"
          >
            Esperando Definición
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Local -->
          <button
            type="button"
            class="flex flex-col items-center justify-center p-3 rounded-xl border text-center gap-2 group/team cursor-pointer"
            :class="[
              getSelectedWinnerInMatch(match) === match.localTeamId
                ? isTeamCorrect(activeTab, match.localTeamId)
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isTeamIncorrect(activeTab, match.localTeamId)
                    ? 'border-error-500 bg-error-500/10 text-error-600 dark:text-error-400'
                    : 'border-secondary-500 bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 font-extrabold'
                : 'border-(--ui-border) bg-(--ui-bg-elevated) text-neutral-800 dark:text-neutral-200 hover:border-neutral-400',
              isLocked || match.localTeamId === 'tbd' || !match.localTeamId ? 'opacity-85 pointer-events-none' : 'active:scale-95'
            ]"
            @click="selectMatchWinner(match, match.localTeamId)"
          >
            <MatchTeamLogo
              :logo-url="match.localTeamLogo"
              :name="match.localTeamName || ''"
              size="md"
            />
            <span class="text-xs font-bold uppercase tracking-wide truncate max-w-full">
              {{ match.localTeamName }}
            </span>

            <div class="flex items-center gap-1 mt-1">
              <UIcon
                v-if="getSelectedWinnerInMatch(match) === match.localTeamId && isTeamCorrect(activeTab, match.localTeamId)"
                name="i-lucide-circle-check"
                class="size-4 text-emerald-500"
              />
              <UIcon
                v-else-if="getSelectedWinnerInMatch(match) === match.localTeamId && isTeamIncorrect(activeTab, match.localTeamId)"
                name="i-lucide-circle-x"
                class="size-4 text-error-500"
              />
              <UIcon
                v-else-if="getSelectedWinnerInMatch(match) === match.localTeamId"
                name="i-lucide-check-circle-2"
                class="size-4 text-secondary-500"
              />
            </div>
          </button>

          <!-- Visitante -->
          <button
            type="button"
            class="flex flex-col items-center justify-center p-3 rounded-xl border text-center gap-2 group/team cursor-pointer"
            :class="[
              getSelectedWinnerInMatch(match) === match.visitorTeamId
                ? isTeamCorrect(activeTab, match.visitorTeamId)
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isTeamIncorrect(activeTab, match.visitorTeamId)
                    ? 'border-error-500 bg-error-500/10 text-error-600 dark:text-error-400'
                    : 'border-secondary-500 bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 font-extrabold'
                : 'border-(--ui-border) bg-(--ui-bg-elevated) text-neutral-800 dark:text-neutral-200 hover:border-neutral-400',
              isLocked || match.visitorTeamId === 'tbd' || !match.visitorTeamId ? 'opacity-85 pointer-events-none' : 'active:scale-95'
            ]"
            @click="selectMatchWinner(match, match.visitorTeamId)"
          >
            <MatchTeamLogo
              :logo-url="match.visitorTeamLogo"
              :name="match.visitorTeamName || ''"
              size="md"
            />
            <span class="text-xs font-bold uppercase tracking-wide truncate max-w-full">
              {{ match.visitorTeamName }}
            </span>

            <div class="flex items-center gap-1 mt-1">
              <UIcon
                v-if="getSelectedWinnerInMatch(match) === match.visitorTeamId && isTeamCorrect(activeTab, match.visitorTeamId)"
                name="i-lucide-circle-check"
                class="size-4 text-emerald-500"
              />
              <UIcon
                v-else-if="getSelectedWinnerInMatch(match) === match.visitorTeamId && isTeamIncorrect(activeTab, match.visitorTeamId)"
                name="i-lucide-circle-x"
                class="size-4 text-error-500"
              />
              <UIcon
                v-else-if="getSelectedWinnerInMatch(match) === match.visitorTeamId"
                name="i-lucide-check-circle-2"
                class="size-4 text-secondary-500"
              />
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Botón Flotante/Guardar -->
    <div
      v-if="!isLocked"
      class="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-40 stagger-up stagger-d4"
    >
      <UButton
        color="primary"
        size="lg"
        block
        icon="i-lucide-save"
        class="shadow-xl py-3 cursor-pointer"
        :disabled="!isSelectionChanged"
        :loading="saving"
        @click="handleSave"
      >
        Guardar Pronóstico
      </UButton>
    </div>
  </div>
</template>
