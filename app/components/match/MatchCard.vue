<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { PredictionWithMatch } from '~/types'

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

const localGoals = ref(props.prediction.localGoalPrediction ?? 0)
const visitorGoals = ref(props.prediction.visitorGoalPrediction ?? 0)

// "Saved" baseline: tracks the last value successfully written to Firestore.
// We compare the live controls against this, NOT against props, so that after
// randomize() the button stays enabled (randomized ≠ saved) and after save()
// the button correctly disables again (live === saved).
const savedLocal = ref(props.prediction.localGoalPrediction ?? 0)
const savedVisitor = ref(props.prediction.visitorGoalPrediction ?? 0)

// Sync when the prediction prop is replaced from the outside (initial load,
// optimistic update after save). Reset both controls AND the saved baseline.
watch(
  () => props.prediction,
  (p) => {
    localGoals.value = p.localGoalPrediction ?? 0
    visitorGoals.value = p.visitorGoalPrediction ?? 0
    savedLocal.value = p.localGoalPrediction ?? 0
    savedVisitor.value = p.visitorGoalPrediction ?? 0
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
  return dayjs().isAfter(matchDate.subtract(5, 'minute'))
})

const isLocked = computed(
  () => props.isReadonly || matchStarted.value || props.prediction.match.isClosed
)

const formattedDate = computed(() =>
  dayjs(props.prediction.match.date).format('ddd D MMM · HH:mm')
)

function increment(team: 'local' | 'visitor') {
  if (isLocked.value) return
  if (team === 'local' && localGoals.value < 20) localGoals.value++
  if (team === 'visitor' && visitorGoals.value < 20) visitorGoals.value++
}

function decrement(team: 'local' | 'visitor') {
  if (isLocked.value) return
  if (team === 'local' && localGoals.value > 0) localGoals.value--
  if (team === 'visitor' && visitorGoals.value > 0) visitorGoals.value--
}

function handleSave() {
  if (isLocked.value || !hasChanged.value) return
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
      header: 'px-6 pt-6 pb-2',
      body: 'px-6 py-6',
      footer: 'px-6 pb-6 pt-2'
    }"
  >
    <!-- Fase + fecha -->
    <template #header>
      <div
        class="flex items-center justify-between text-[11px] text-neutral-500 font-bold tracking-widest uppercase"
      >
        <div class="flex flex-col gap-0.5">
          <span class="font-heading text-primary-500 dark:text-primary-400">{{ prediction.match.phase }}</span>
          <span class="text-[10px] text-(--ui-text-muted) font-mono normal-case tracking-normal">{{ formattedDate }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            v-if="prediction.match.isActive && !prediction.match.isClosed"
            class="live-indicator"
          />
          <span
            v-if="prediction.match.isActive && !prediction.match.isClosed"
            class="text-error-500 font-black"
          >
            EN VIVO
          </span>
        </div>
      </div>
    </template>

    <!-- Equipos y controles -->
    <div class="flex flex-col gap-6">
      <div
        class="text-center text-[11px] text-neutral-400 uppercase tracking-widest font-bold"
      >
        {{ prediction.match.stadium || "Estadio Mundialista" }}
      </div>

      <div class="flex items-center justify-around gap-2">
        <!-- Equipo local -->
        <div class="flex-1 flex flex-col items-center gap-4">
          <div class="relative">
            <MatchTeamLogo
              :logo-url="prediction.match.localTeamLogo"
              :name="prediction.match.localTeamName"
              size="lg"
              class="w-16 h-16"
            />
          </div>
          <span
            class="text-sm font-heading font-bold text-neutral-700 dark:text-white text-center leading-tight line-clamp-1 uppercase whitespace-nowrap"
          >
            {{ prediction.match.localTeamName }}
          </span>
          <!-- Controles goles local -->
          <MatchGoalControl
            v-if="!isLocked"
            :value="localGoals"
            @increment="increment('local')"
            @decrement="decrement('local')"
          />
          <div
            v-else
            class="score-pill"
          >
            {{ localGoals }}
          </div>
        </div>

        <!-- Separador VS -->
        <div class="flex flex-col items-center gap-2 shrink-0">
          <span
            class="font-heading text-xs font-black text-neutral-300 tracking-widest"
          >VS</span>
          <UBadge
            v-if="isLocked && !prediction.match.isClosed"
            color="neutral"
            variant="soft"
            size="xs"
            class="rounded-full px-2"
          >
            <UIcon
              name="i-lucide-lock"
              class="size-3 mr-1"
            />
            Cerrado
          </UBadge>
          <UBadge
            v-if="prediction.match.isClosed"
            color="neutral"
            variant="outline"
            size="xs"
            class="rounded-full px-2"
          >
            {{ prediction.match.localGoals }}-{{
              prediction.match.visitorGoals
            }}
          </UBadge>
        </div>

        <!-- Equipo visitante -->
        <div class="flex-1 flex flex-col items-center gap-4">
          <div class="relative">
            <MatchTeamLogo
              :logo-url="prediction.match.visitorTeamLogo"
              :name="prediction.match.visitorTeamName"
              size="lg"
              class="w-16 h-16"
            />
          </div>
          <span
            class="text-sm font-heading font-bold text-neutral-700 dark:text-white text-center leading-tight line-clamp-1 uppercase whitespace-nowrap"
          >
            {{ prediction.match.visitorTeamName }}
          </span>
          <MatchGoalControl
            v-if="!isLocked"
            :value="visitorGoals"
            @increment="increment('visitor')"
            @decrement="decrement('visitor')"
          />
          <div
            v-else
            class="score-pill"
          >
            {{ visitorGoals }}
          </div>
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
          :disabled="!hasChanged"
          :loading="saving"
          @click="handleSave"
        >
          Guardar
        </UButton>
      </div>

      <!-- Resultado + puntos para partidos cerrados -->
      <div
        v-else-if="prediction.match.isClosed"
        class="flex items-center justify-between"
      >
        <div class="text-xs text-(--ui-text-muted)">
          Tu predicción:
          <span class="font-semibold text-(--ui-text)">
            {{ prediction.localGoalPrediction }} -
            {{ prediction.visitorGoalPrediction }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <MatchResultBadge :points="prediction.points" />
          <NuxtLink
            v-if="boardId"
            :to="`/board/${boardId}/match/${prediction.match.id}`"
            class="text-[10px] font-bold uppercase tracking-wider text-primary-500 hover:text-primary-400 transition-colors flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-users"
              class="size-3"
            />
            Ver todos
          </NuxtLink>
        </div>
      </div>
    </template>
  </UCard>
</template>
