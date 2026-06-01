<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { matchService } from '~/services/match.service'
import { boardRepository } from '~/repositories/board.repository'
import { predictionRepository } from '~/repositories/prediction.repository'
import { isMatchActive, isMatchClosed } from '~/types/match'
import type { MatchPredictionEntry } from '~/types'

dayjs.locale('es')

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

const boardId = computed(() => route.params.boardId as string)
const matchId = computed(() => route.params.matchId as string)

// Necesitamos el groupId del board para obtener las predicciones del grupo
const { board, loadBoard } = useBoard()

const match = ref<import('~/types').Match | null>(null)
const predictions = ref<MatchPredictionEntry[]>([])
const loading = ref(true)

const predictionsClosed = computed(() => {
  if (!match.value) return false
  const matchDate = dayjs(match.value.date)
  return dayjs().isAfter(matchDate.subtract(30, 'minute')) || isMatchClosed(match.value) || isMatchActive(match.value)
})

onMounted(async () => {
  try {
    appStore.setPageTitle('Detalle del partido')
    const ok = await loadBoard(boardId.value)
    if (!ok) return // toast ya fue mostrado por useBoard

    const matchData = await matchService.findById(matchId.value)
    match.value = matchData

    if (board.value?.groupId) {
      const boards = await boardRepository.findActiveByGroup(board.value.groupId)
      const boardIds = boards.map(b => b.id)
      const preds = await predictionRepository.findByMatchAndGroup(matchId.value, boardIds)

      const filteredPreds = predictionsClosed.value
        ? preds
        : preds.filter((p) => {
            const b = boards.find(bb => bb.id === p.boardId)
            return b?.userId === authStore.user?.id
          })

      predictions.value = filteredPreds.map((pred): MatchPredictionEntry => {
        const b = boards.find(bb => bb.id === pred.boardId)
        return {
          boardId: pred.boardId,
          boardNumber: b?.number ?? 0,
          userId: b?.userId ?? '',
          userDisplayName: b?.userDisplayName ?? '',
          userPhotoURL: b?.userPhotoURL,
          localGoalPrediction: pred.localGoalPrediction,
          visitorGoalPrediction: pred.visitorGoalPrediction,
          points: pred.points
        }
      }).sort((a, b) => {
        // Primero los que tienen puntos (partido cerrado), luego los sin pronóstico
        if (b.points !== null && a.points === null) return 1
        if (a.points !== null && b.points === null) return -1
        if (a.points !== null && b.points !== null) return b.points - a.points
        // Ambos null: los que tienen pronóstico primero
        const aHas = a.localGoalPrediction !== null
        const bHas = b.localGoalPrediction !== null
        if (aHas && !bHas) return -1
        if (!aHas && bHas) return 1
        return 0
      })
    }
  } finally {
    loading.value = false
  }
})

const formattedDate = computed(() =>
  match.value ? dayjs(match.value.date).format('dddd D [de] MMMM [·] HH:mm') : ''
)
</script>

<template>
  <div class="space-y-0 pb-20">
    <LayoutPageHeader
      title="Detalle del Partido"
      :subtitle="match ? `${match.phase} · ${formattedDate}` : ''"
      show-back
    >
      <template #back>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          size="sm"
          class="rounded-full"
          @click="$router.back()"
        />
      </template>
    </LayoutPageHeader>

    <div class="px-4 -mt-16 relative z-10 space-y-6">
      <!-- Info del partido -->
      <div
        v-if="loading"
        class="space-y-4"
      >
        <USkeleton class="h-32 rounded-[32px]" />
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-16 rounded-2xl"
        />
      </div>

      <template v-else-if="match">
        <div class="card-elevated p-6 stagger-up">
          <div class="flex items-center justify-between gap-4">
            <!-- Local -->
            <div class="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div class="size-16 bg-(--ui-bg-muted) rounded-2xl flex items-center justify-center p-2 border border-(--ui-border) shadow-inner">
                <MatchTeamLogo
                  :logo-url="match.localTeamLogo"
                  :name="match.localTeamName ?? ''"
                  size="lg"
                />
              </div>
              <span class="font-heading text-xs font-bold text-center uppercase tracking-wider text-(--ui-text-highlighted) line-clamp-2 leading-tight">
                {{ match.localTeamName }}
              </span>
            </div>

            <!-- Score -->
            <div class="flex flex-col items-center gap-1">
              <div class="flex items-center gap-3">
                <span class="font-heading text-4xl font-black text-(--ui-text-highlighted) tabular-nums">
                  {{ match.localGoals !== null ? match.localGoals + (match.localGoalsOT ?? 0) : '-' }}
                </span>
                <span class="text-primary-500 font-black text-xl">:</span>
                <span class="font-heading text-4xl font-black text-(--ui-text-highlighted) tabular-nums">
                  {{ match.visitorGoals !== null ? match.visitorGoals + (match.visitorGoalsOT ?? 0) : '-' }}
                </span>
              </div>
              <UBadge
                v-if="isMatchClosed(match)"
                color="neutral"
                variant="soft"
                size="sm"
                class="font-bold uppercase tracking-widest text-[10px] rounded-full"
              >
                Finalizado
              </UBadge>
              <div
                v-if="isMatchClosed(match)"
                class="text-[10px] text-primary-500 font-bold uppercase tracking-wider text-center mt-1"
              >
                <span v-if="(match.localGoalsOT ?? 0) > 0 || (match.visitorGoalsOT ?? 0) > 0">
                  90 min: {{ match.localGoals }} - {{ match.visitorGoals }}
                </span>
                <span
                  v-if="match.localPenalties !== undefined && match.localPenalties !== null"
                  class="block text-[9px] text-primary-400 mt-0.5"
                >
                  ({{ match.localPenalties }} - {{ match.visitorPenalties }} Pen)
                </span>
              </div>
              <div
                v-else-if="isMatchActive(match)"
                class="flex items-center gap-1.5"
              >
                <span class="live-indicator" />
                <span class="text-[10px] font-bold text-error-500 uppercase tracking-widest">En Vivo</span>
              </div>
            </div>

            <!-- Visitor -->
            <div class="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div class="size-16 bg-(--ui-bg-muted) rounded-2xl flex items-center justify-center p-2 border border-(--ui-border) shadow-inner">
                <MatchTeamLogo
                  :logo-url="match.visitorTeamLogo"
                  :name="match.visitorTeamName ?? ''"
                  size="lg"
                />
              </div>
              <span class="font-heading text-xs font-bold text-center uppercase tracking-wider text-(--ui-text-highlighted) line-clamp-2 leading-tight">
                {{ match.visitorTeamName }}
              </span>
            </div>
          </div>
        </div>

        <!-- Predicciones del grupo -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-heading text-lg font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
              Predicciones del Grupo
            </h2>
            <UBadge
              color="primary"
              variant="soft"
              class="rounded-lg font-bold"
            >
              {{ predictions.length }} {{ predictions.length === 1 ? 'Tabla' : 'Tablas' }}
            </UBadge>
          </div>

          <!-- Alerta: predicciones bloqueadas/abiertas -->
          <div
            v-if="!predictionsClosed"
            class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-start gap-2.5 shadow-sm stagger-up"
          >
            <UIcon
              name="i-lucide-lock"
              class="size-4 shrink-0 mt-0.5"
            />
            <span>
              Las predicciones de los demás participantes están ocultas y se revelarán automáticamente 30 minutos antes del inicio del partido para mantener el juego justo.
            </span>
          </div>

          <div class="card-elevated overflow-hidden stagger-up stagger-d1">
            <table class="w-full table-fixed">
              <thead>
                <tr class="bg-(--ui-bg-muted)/50 border-b border-(--ui-border)">
                  <th class="text-left px-2.5 xs:px-4 py-3 font-heading text-[10px] xs:text-[11px] font-black text-(--ui-text-muted) uppercase tracking-widest">
                    Participante
                  </th>
                  <th class="text-center px-1 xs:px-3 py-3 font-heading text-[10px] xs:text-[11px] font-black text-(--ui-text-muted) uppercase tracking-widest w-24 xs:w-28">
                    Pronóstico
                  </th>
                  <th class="text-right px-2.5 xs:px-4 py-3 font-heading text-[10px] xs:text-[11px] font-black text-(--ui-text-muted) uppercase tracking-widest w-20 xs:w-24">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-(--ui-border)/50">
                <tr
                  v-for="(pred, i) in predictions"
                  :key="pred.boardId"
                  class="stagger-up"
                  :class="[
                    `stagger-d${Math.min(i + 2, 12)}`,
                    pred.userId === authStore.user?.id ? 'bg-primary-500/5 dark:bg-primary-400/5 font-semibold' : ''
                  ]"
                >
                  <!-- Participante -->
                  <td class="px-2.5 xs:px-4 py-2.5 xs:py-3.5 min-w-0">
                    <div class="flex items-center gap-2 xs:gap-3 min-w-0">
                      <div
                        class="size-7 xs:size-8 rounded-full flex items-center justify-center text-[9px] xs:text-[10px] font-black shadow-sm shrink-0 overflow-hidden border border-(--ui-border)/50"
                        :class="[
                          pred.userId === authStore.user?.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-(--ui-bg-muted) text-(--ui-text-muted)'
                        ]"
                      >
                        <img
                          v-if="pred.userPhotoURL"
                          :src="pred.userPhotoURL"
                          alt="Avatar"
                          class="size-full object-cover"
                          referrerpolicy="no-referrer"
                        >
                        <span v-else>{{ pred.userDisplayName?.charAt(0).toUpperCase() || '?' }}</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p
                          class="text-xs xs:text-sm font-bold truncate leading-tight"
                          :class="pred.userId === authStore.user?.id ? 'text-primary-600 dark:text-primary-400' : 'text-(--ui-text-highlighted)'"
                        >
                          {{ pred.userDisplayName }}
                        </p>
                        <p class="text-[9px] text-(--ui-text-muted) font-mono uppercase tracking-tighter mt-0.5 leading-none">
                          Tabla #{{ pred.boardNumber }}
                        </p>
                      </div>
                    </div>
                  </td>

                  <!-- Pronóstico -->
                  <td class="px-1 xs:px-3 py-2.5 xs:py-3.5 text-center w-24 xs:w-28 shrink-0">
                    <span
                      v-if="pred.localGoalPrediction !== null && pred.visitorGoalPrediction !== null"
                      class="font-heading text-xs xs:text-sm font-black text-(--ui-text-highlighted) tabular-nums tracking-wider bg-(--ui-bg-muted) px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg border border-(--ui-border)/50"
                    >
                      {{ pred.localGoalPrediction }} - {{ pred.visitorGoalPrediction }}
                    </span>
                    <span
                      v-else
                      class="text-[9px] xs:text-[10px] font-bold text-(--ui-text-muted)/70 dark:text-neutral-500 uppercase tracking-wider italic bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"
                    >
                      Vacío
                    </span>
                  </td>

                  <!-- Puntos -->
                  <td class="px-2.5 xs:px-4 py-2.5 xs:py-3.5 text-right w-20 xs:w-24 shrink-0">
                    <MatchResultBadge
                      :points="pred.points"
                      size="sm"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- Empty state: match not found -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-20 px-6 text-center stagger-up"
      >
        <div class="size-20 rounded-full bg-(--ui-bg-elevated) border border-(--ui-border) flex items-center justify-center mb-6 shadow-inner">
          <UIcon
            name="i-lucide-calendar-x"
            class="size-10 text-(--ui-text-muted)"
          />
        </div>
        <h3 class="font-heading text-xl font-black text-(--ui-text-highlighted) uppercase tracking-wide mb-2">
          Partido no encontrado
        </h3>
        <p class="text-sm text-(--ui-text-muted) mb-8 max-w-xs">
          Este partido no existe o fue eliminado del sistema.
        </p>
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-arrow-left"
          class="rounded-full"
          @click="$router.back()"
        >
          Volver
        </UButton>
      </div>
    </div>
  </div>
</template>
