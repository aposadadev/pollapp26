<script setup lang="ts">
import { onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { PredictionWithMatch } from '~/types'
import { isMatchActive, isMatchClosed } from '~/types/match'
import { predictionService } from '~/services/prediction.service'

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
}>()

const localGoals = ref<number | null>(props.prediction.localGoalPrediction)
const visitorGoals = ref<number | null>(props.prediction.visitorGoalPrediction)

// "Saved" baseline: tracks the last value successfully written to Firestore.
// We compare the live controls against this, NOT against props, so that after
// randomize() the button stays enabled (randomized ≠ saved) and after save()
// the button correctly disables again (live === saved).
const savedLocal = ref<number | null>(props.prediction.localGoalPrediction)
const savedVisitor = ref<number | null>(props.prediction.visitorGoalPrediction)

let saveTimeout: ReturnType<typeof setTimeout> | null = null
const isSavingSoon = ref(false)

function cancelScheduledSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
}

// Sync when the prediction prop is replaced from the outside (initial load,
// optimistic update after save). Reset both controls AND the saved baseline.
watch(
  () => props.prediction,
  (p) => {
    cancelScheduledSave()
    isSavingSoon.value = false
    localGoals.value = p.localGoalPrediction
    visitorGoals.value = p.visitorGoalPrediction
    savedLocal.value = p.localGoalPrediction
    savedVisitor.value = p.visitorGoalPrediction
  },
  { deep: true }
)

onUnmounted(() => {
  cancelScheduledSave()
})

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
  cancelScheduledSave()
  isSavingSoon.value = false
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
  cancelScheduledSave()
  isSavingSoon.value = false
  if (team === 'local') {
    if (localGoals.value !== null && localGoals.value > 0) localGoals.value--
  }
  if (team === 'visitor') {
    if (visitorGoals.value !== null && visitorGoals.value > 0) visitorGoals.value--
  }
}

function handleSave() {
  cancelScheduledSave()
  isSavingSoon.value = false
  if (isLocked.value || !hasChanged.value) return
  if (localGoals.value === null || visitorGoals.value === null) return
  emit('save', props.prediction.id, localGoals.value, visitorGoals.value)
}

const localRandomizing = ref(false)

async function handleRandomize() {
  if (isLocked.value || localRandomizing.value) return
  cancelScheduledSave()
  isSavingSoon.value = false
  localRandomizing.value = true

  let ticks = 0
  const maxTicks = 10 // ~600ms total

  const interval = setInterval(() => {
    const temp = predictionService.generateRandom()
    localGoals.value = temp.local
    visitorGoals.value = temp.visitor
    ticks++

    if (ticks >= maxTicks) {
      clearInterval(interval)
      localRandomizing.value = false

      // Schedule save in 1 second (1000ms)
      isSavingSoon.value = true
      saveTimeout = setTimeout(() => {
        isSavingSoon.value = false
        handleSave()
      }, 1000)
    }
  }, 60)
}
</script>

<template>
  <div
    class="card-elevated border border-(--ui-border) overflow-hidden transition-all duration-300 hover:shadow-lg rounded-xl bg-(--ui-bg-elevated) flex flex-col"
  >
    <!-- Fase + fecha -->
    <div
      class="px-4 py-2 bg-neutral-50/50 dark:bg-neutral-800/10 border-b border-neutral-100 dark:border-neutral-800/30 flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider"
    >
      <div class="flex items-center gap-1 truncate">
        <span class="font-heading text-primary-500 dark:text-primary-400">
          {{ prediction.match.phase }}
        </span>
        <span
          v-if="prediction.match.stadium"
          class="text-neutral-400/80 font-normal normal-case hidden sm:inline"
        >
          · {{ prediction.match.stadium }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-neutral-400/90 font-mono normal-case tracking-normal">{{ formattedDate }}</span>
        <UBadge
          v-if="isLocked && !isMatchClosed(prediction.match)"
          color="neutral"
          variant="soft"
          size="xs"
          class="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-extrabold"
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
          class="text-error-500 font-black text-[9px] tracking-wider"
        >
          EN VIVO
        </span>
      </div>
    </div>

    <!-- Equipos y controles en grilla simétrica -->
    <div class="px-4 py-3.5">
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <!-- Equipo local -->
        <div class="flex flex-col items-center justify-center gap-1.5 text-center min-w-0">
          <MatchTeamLogo
            :logo-url="prediction.match.localTeamLogo"
            :name="prediction.match.localTeamName"
            size="md"
            class="shrink-0"
          />
          <span class="text-xs sm:text-sm font-heading font-black text-neutral-800 dark:text-white truncate uppercase tracking-wide">
            {{ prediction.match.localTeamName }}
          </span>
          <!-- Botones debajo del equipo local -->
          <div
            v-if="!isLocked"
            class="flex items-center gap-1 mt-0.5"
          >
            <button
              type="button"
              class="w-7 h-7 rounded-lg text-(--ui-text-muted) hover:text-(--ui-text) hover:bg-(--ui-bg-muted) border border-(--ui-border)/50 transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
              @click="decrement('local')"
            >
              <UIcon
                name="i-lucide-minus"
                class="size-4"
              />
            </button>
            <button
              type="button"
              class="w-7 h-7 rounded-lg text-(--ui-text-muted) hover:text-(--ui-text) hover:bg-(--ui-bg-muted) border border-(--ui-border)/50 transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
              @click="increment('local')"
            >
              <UIcon
                name="i-lucide-plus"
                class="size-4"
              />
            </button>
          </div>
        </div>

        <!-- Controles de marcador -->
        <div class="flex items-center justify-center gap-2.5 shrink-0">
          <div class="score-pill py-1 text-sm min-w-[36px] h-8 flex items-center justify-center font-bold">
            {{ localGoals ?? '-' }}
          </div>
          <span class="text-xs font-black text-neutral-400 dark:text-neutral-500 font-heading tracking-wider">VS</span>
          <div class="score-pill py-1 text-sm min-w-[36px] h-8 flex items-center justify-center font-bold">
            {{ visitorGoals ?? '-' }}
          </div>
        </div>

        <!-- Equipo visitante -->
        <div class="flex flex-col items-center justify-center gap-1.5 text-center min-w-0">
          <MatchTeamLogo
            :logo-url="prediction.match.visitorTeamLogo"
            :name="prediction.match.visitorTeamName"
            size="md"
            class="shrink-0"
          />
          <span class="text-xs sm:text-sm font-heading font-black text-neutral-800 dark:text-white truncate uppercase tracking-wide">
            {{ prediction.match.visitorTeamName }}
          </span>
          <!-- Botones debajo del equipo visitante -->
          <div
            v-if="!isLocked"
            class="flex items-center gap-1 mt-0.5"
          >
            <button
              type="button"
              class="w-7 h-7 rounded-lg text-(--ui-text-muted) hover:text-(--ui-text) hover:bg-(--ui-bg-muted) border border-(--ui-border)/50 transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
              @click="decrement('visitor')"
            >
              <UIcon
                name="i-lucide-minus"
                class="size-4"
              />
            </button>
            <button
              type="button"
              class="w-7 h-7 rounded-lg text-(--ui-text-muted) hover:text-(--ui-text) hover:bg-(--ui-bg-muted) border border-(--ui-border)/50 transition-all duration-200 active:scale-90 flex items-center justify-center cursor-pointer"
              @click="increment('visitor')"
            >
              <UIcon
                name="i-lucide-plus"
                class="size-4"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones o Resultados (Footer) -->
    <div class="px-4 pb-4 pt-1 flex flex-col gap-2">
      <!-- Botones para predicciones abiertas -->
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
          :loading="localRandomizing"
          :disabled="localRandomizing"
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
          :loading="saving || isSavingSoon"
          @click="handleSave"
        >
          {{ isSavingSoon ? 'Guardando...' : 'Guardar' }}
        </UButton>
      </div>

      <!-- Resultados y puntos para partidos cerrados -->
      <div
        v-else-if="isMatchClosed(prediction.match)"
        class="w-full flex flex-col gap-2.5 p-3 rounded-lg border border-dashed transition-all duration-300"
        :class="{
          'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30': prediction.points === 3,
          'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30': prediction.points === 1,
          'bg-neutral-500/5 dark:bg-neutral-500/10 border-neutral-300 dark:border-neutral-800': prediction.points === 0
        }"
      >
        <!-- Fila Superior: Tu pronóstico y Goles 90 min (si aplica) -->
        <div class="flex items-center justify-between pb-2.5 border-b border-neutral-200/50 dark:border-neutral-800/50">
          <div class="flex items-center gap-2">
            <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">Tu pronóstico:</span>
            <span class="text-xs font-black text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded font-mono">
              {{ prediction.localGoalPrediction }} - {{ prediction.visitorGoalPrediction }}
            </span>
          </div>

          <!-- Goles 90 min (solo si difiere del global/si hubo extra time) o Penales -->
          <div
            v-if="((prediction.match.localGoalsOT ?? 0) > 0 || (prediction.match.visitorGoalsOT ?? 0) > 0) || (prediction.match.localPenalties !== undefined && prediction.match.localPenalties !== null)"
            class="flex items-center gap-2"
          >
            <template v-if="(prediction.match.localGoalsOT ?? 0) > 0 || (prediction.match.visitorGoalsOT ?? 0) > 0">
              <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">Goles 90 min:</span>
              <span class="text-xs font-black text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded font-mono">
                {{ prediction.match.localGoals }} - {{ prediction.match.visitorGoals }}
              </span>
            </template>
            <span
              v-if="prediction.match.localPenalties !== undefined && prediction.match.localPenalties !== null"
              class="text-[10px] font-bold text-primary-500 dark:text-primary-400 font-mono"
            >
              ({{ prediction.match.localPenalties }} - {{ prediction.match.visitorPenalties }} Pen)
            </span>
          </div>
        </div>

        <!-- Fila Inferior: Puntos Ganados + Enlace Ver Todos -->
        <div class="flex items-center justify-between gap-4">
          <MatchResultBadge
            :points="prediction.points"
            size="sm"
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
    </div>
  </div>
</template>
