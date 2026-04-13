<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { PredictionWithMatch } from '~/types'

dayjs.locale('es')

interface Props {
  prediction: PredictionWithMatch
  saving?: boolean
  readonly?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [predictionId: string, local: number, visitor: number]
  randomize: [predictionId: string]
}>()

const localGoals = ref(props.prediction.localGoalPrediction ?? 0)
const visitorGoals = ref(props.prediction.visitorGoalPrediction ?? 0)

// Sincronizar cuando cambien las props (ej. después de cargar)
watch(
  () => props.prediction,
  (p) => {
    localGoals.value = p.localGoalPrediction ?? 0
    visitorGoals.value = p.visitorGoalPrediction ?? 0
  },
  { deep: true }
)

const hasChanged = computed(
  () =>
    localGoals.value !== (props.prediction.localGoalPrediction ?? 0)
    || visitorGoals.value !== (props.prediction.visitorGoalPrediction ?? 0)
)

const matchStarted = computed(() => {
  const matchDate = dayjs(props.prediction.match.date)
  return dayjs().isAfter(matchDate.subtract(5, 'minute'))
})

const isLocked = computed(
  () => props.readonly || matchStarted.value || props.prediction.match.isClosed
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

// Sincronizar si el padre hace randomize
watch(
  () => [
    props.prediction.localGoalPrediction,
    props.prediction.visitorGoalPrediction
  ],
  ([l, v]) => {
    localGoals.value = l ?? 0
    visitorGoals.value = v ?? 0
  }
)
</script>

<template>
  <UCard
    class="overflow-hidden transition-all duration-300 hover:shadow-xl border-none glass-card"
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
        <span class="font-heading">{{ prediction.match.phase }}</span>
        <span
          :class="
            !prediction.match.isClosed
              && prediction.match.localGoals !== null
              && prediction.match.visitorGoals !== null
              ? 'live-indicator text-secondary-500'
              : ''
          "
        >
          <template
            v-if="
              !prediction.match.isClosed && prediction.match.localGoals !== null
            "
          >
            🔴 EN VIVO
          </template>
          <template v-else>
            {{ formattedDate }}
          </template>
        </span>
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
              name="i-heroicons-lock-closed"
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
        <MatchResultBadge :points="prediction.points" />
      </div>
    </template>
  </UCard>
</template>
