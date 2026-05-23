<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { PredictionWithMatch } from '~/types'
import { isMatchActive, isMatchClosed } from '~/types/match'

dayjs.locale('es')

interface Props {
  prediction: PredictionWithMatch
  saving?: boolean
  isReadonly?: boolean
  boardId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [predictionId: string, local: number, visitor: number]
  randomize: [predictionId: string]
}>()

const localGoals = ref<number | null>(props.prediction.localGoalPrediction)
const visitorGoals = ref<number | null>(props.prediction.visitorGoalPrediction)

// "Saved" baseline: tracks the last value successfully written to Firestore.
// We compare the live controls against this, NOT against props, so that after
// randomize() the button stays enabled (randomized ≠ saved) and after save()
// the button correctly disables again (live === saved).
const savedLocal = ref<number | null>(props.prediction.localGoalPrediction)
const savedVisitor = ref<number | null>(props.prediction.visitorGoalPrediction)

// Sync when the prediction prop is replaced from the outside (initial load,
// optimistic update after save). Reset both controls AND the saved baseline.
watch(
  () => props.prediction,
  (p) => {
    localGoals.value = p.localGoalPrediction
    visitorGoals.value = p.visitorGoalPrediction
    savedLocal.value = p.localGoalPrediction
    savedVisitor.value = p.visitorGoalPrediction
  },
  { deep: true }
)

const hasChanged = computed(
  () =>
    localGoals.value !== savedLocal.value
    || visitorGoals.value !== savedVisitor.value
)

const matchStarted = computed(() => {
  const matchDate = dayjs(props.prediction.match.date)
  return dayjs().isAfter(matchDate.subtract(30, 'minute'))
})

const isLocked = computed(
  () => props.isReadonly || matchStarted.value || isMatchClosed(props.prediction.match) || isMatchActive(props.prediction.match)
)

const predictionsClosed = computed(() => {
  const matchDate = dayjs(props.prediction.match.date)
  return dayjs().isAfter(matchDate.subtract(30, 'minute')) || isMatchClosed(props.prediction.match) || isMatchActive(props.prediction.match)
})

const formattedDate = computed(() =>
  dayjs(props.prediction.match.date).format('ddd D MMM · HH:mm')
)

function increment(team: 'local' | 'visitor') {
  if (isLocked.value) return
  if (team === 'local') {
    if (localGoals.value === null) localGoals.value = 0
    else if (localGoals.value < 20) localGoals.value++
  }
  if (team === 'visitor') {
    if (visitorGoals.value === null) visitorGoals.value = 0
    else if (visitorGoals.value < 20) visitorGoals.value++
  }
}

function decrement(team: 'local' | 'visitor') {
  if (isLocked.value) return
  if (team === 'local') {
    if (localGoals.value !== null && localGoals.value > 0) localGoals.value--
  }
  if (team === 'visitor') {
    if (visitorGoals.value !== null && visitorGoals.value > 0) visitorGoals.value--
  }
}

function handleSave() {
  if (isLocked.value || !hasChanged.value) return
  if (localGoals.value === null || visitorGoals.value === null) return
  emit('save', props.prediction.id, localGoals.value, visitorGoals.value)
}

function handleRandomize() {
  if (isLocked.value) return
  emit('randomize', props.prediction.id)
}
</script>

<template>
  <UCard
    class="overflow-hidden transition-all duration-300 hover:shadow-xl border border-(--ui-border)"
    :ui="{
      header: 'px-4 pt-4 pb-2',
      body: 'px-4 py-3.5',
      footer: 'px-4 pb-4 pt-2'
    }"
  >
    <!-- Fase + fecha -->
    <template #header>
      <div
        class="flex items-center justify-between text-[11px] text-neutral-500 font-bold tracking-widest uppercase"
      >
        <div class="flex flex-col gap-0.5">
          <span class="font-heading text-primary-500 dark:text-primary-400">
            {{ prediction.match.phase }}
            <span
              v-if="prediction.match.stadium"
              class="text-[9px] text-(--ui-text-muted) font-normal normal-case tracking-normal"
            >
              · {{ prediction.match.stadium }}
            </span>
          </span>
          <span class="text-[10px] text-(--ui-text-muted) font-mono normal-case tracking-normal">{{ formattedDate }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UBadge
            v-if="isLocked && !isMatchClosed(prediction.match)"
            color="neutral"
            variant="soft"
            size="xs"
            class="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold"
          >
            <UIcon
              name="i-lucide-lock"
              class="size-2.5 mr-0.5 text-neutral-400 dark:text-neutral-500"
            />
            Cerrado
          </UBadge>
          <span
            v-if="isMatchActive(prediction.match)"
            class="live-indicator"
          />
          <span
            v-if="isMatchActive(prediction.match)"
            class="text-error-500 font-black text-[10px] tracking-wider"
          >
            EN VIVO
          </span>
        </div>
      </div>
    </template>

    <!-- Equipos y controles -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Equipo local -->
      <div class="flex items-center justify-between sm:justify-end gap-3 sm:flex-1 min-w-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <MatchTeamLogo
            :logo-url="prediction.match.localTeamLogo"
            :name="prediction.match.localTeamName"
            size="md"
          />
          <span class="text-xs sm:text-sm font-heading font-black text-neutral-800 dark:text-white truncate uppercase tracking-wide">
            {{ prediction.match.localTeamName }}
          </span>
        </div>
        <MatchGoalControl
          v-if="!isLocked"
          size="sm"
          :value="localGoals"
          @increment="increment('local')"
          @decrement="decrement('local')"
        />
        <div
          v-else
          class="score-pill py-1 text-sm min-w-[44px] h-8 flex items-center justify-center font-bold"
        >
          {{ localGoals ?? '-' }}
        </div>
      </div>

      <!-- Separador VS (solo en pantallas sm y mayores) -->
      <div class="hidden sm:flex flex-col items-center justify-center shrink-0 min-w-[50px]">
        <span class="font-heading text-[10px] font-black text-neutral-300 dark:text-neutral-600 tracking-wider">VS</span>
      </div>
      <div class="block sm:hidden border-t border-neutral-100 dark:border-neutral-800/40 my-1" />

      <!-- Equipo visitante -->
      <div class="flex items-center justify-between sm:justify-start gap-3 sm:flex-1 min-w-0">
        <div class="flex items-center gap-2.5 min-w-0 sm:order-2">
          <MatchTeamLogo
            :logo-url="prediction.match.visitorTeamLogo"
            :name="prediction.match.visitorTeamName"
            size="md"
          />
          <span class="text-xs sm:text-sm font-heading font-black text-neutral-800 dark:text-white truncate uppercase tracking-wide">
            {{ prediction.match.visitorTeamName }}
          </span>
        </div>
        <MatchGoalControl
          v-if="!isLocked"
          size="sm"
          :value="visitorGoals"
          class="sm:order-1"
          @increment="increment('visitor')"
          @decrement="decrement('visitor')"
        />
        <div
          v-else
          class="score-pill py-1 text-sm min-w-[44px] h-8 flex items-center justify-center font-bold sm:order-1"
        >
          {{ visitorGoals ?? '-' }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <!-- Botones (solo si no está bloqueado) -->
      <div
        v-if="!isLocked"
        class="flex gap-2"
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-shuffle"
          class="flex-1"
          @click="handleRandomize"
        >
          Aleatorio
        </UButton>
        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-save"
          class="flex-1"
          :disabled="!hasChanged || localGoals === null || visitorGoals === null"
          :loading="saving"
          @click="handleSave"
        >
          Guardar
        </UButton>
      </div>

      <!-- Resultado + puntos para partidos cerrados -->
      <div
        v-else-if="isMatchClosed(prediction.match)"
        class="w-full flex flex-col gap-3 p-3.5 rounded-xl border border-dashed transition-all duration-300"
        :class="{
          'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30': prediction.points === 3,
          'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30': prediction.points === 1,
          'bg-neutral-500/5 dark:bg-neutral-500/10 border-neutral-300 dark:border-neutral-800': prediction.points === 0
        }"
      >
        <!-- Fila Superior: Tu pronóstico vs Resultado Oficial -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-neutral-200/50 dark:border-neutral-800/50">
          <div class="flex items-center gap-2">
            <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">Tu pronóstico:</span>
            <span class="text-xs font-black text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded font-mono">
              {{ prediction.localGoalPrediction }} - {{ prediction.visitorGoalPrediction }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">Resultado real:</span>
            <span class="text-xs font-black text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded font-mono">
              {{ prediction.match.localGoals }} - {{ prediction.match.visitorGoals }}
              <template v-if="prediction.match.localGoalsOT !== undefined && prediction.match.localGoalsOT !== null">
                ({{ prediction.match.localGoalsOT }} - {{ prediction.match.visitorGoalsOT }} T.E.<span v-if="prediction.match.localPenalties !== undefined && prediction.match.localPenalties !== null">, {{ prediction.match.localPenalties }} - {{ prediction.match.visitorPenalties }} Pen</span>)
              </template>
            </span>
          </div>
        </div>
        <!-- Fila Inferior: Puntos Ganados + Enlace Ver Todos -->
        <div class="flex items-center justify-between gap-4">
          <MatchResultBadge
            :points="prediction.points"
            size="md"
          />

          <NuxtLink
            v-if="boardId && predictionsClosed"
            :to="`/board/${boardId}/match/${prediction.match.id}`"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-500/5 hover:bg-primary-500/10 dark:bg-primary-400/5 dark:hover:bg-primary-400/10 transition-all active:scale-95 shrink-0"
          >
            <UIcon
              name="i-lucide-users-round"
              class="size-3.5"
            />
            Ver todos
          </NuxtLink>
        </div>
      </div>
      <!-- Predicciones cerradas pero partido no cerrado (en vivo o antes de empezar) -->
      <div
        v-else-if="boardId && predictionsClosed"
        class="w-full flex items-center justify-between gap-4 py-1"
      >
        <span class="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
          Predicciones cerradas.
        </span>
        <NuxtLink
          :to="`/board/${boardId}/match/${prediction.match.id}`"
          class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-500/5 hover:bg-primary-500/10 dark:bg-primary-400/5 dark:hover:bg-primary-400/10 transition-all active:scale-95 shrink-0"
        >
          <UIcon
            name="i-lucide-users-round"
            class="size-3.5"
          />
          Ver todos
        </NuxtLink>
      </div>
    </template>
  </UCard>
</template>
