<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { matchService } from '~/services/match.service'
import { boardRepository } from '~/repositories/board.repository'
import { predictionRepository } from '~/repositories/prediction.repository'
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
      predictions.value = preds.map((pred): MatchPredictionEntry => {
        const b = boards.find(bb => bb.id === pred.boardId)
        return {
          boardId: pred.boardId,
          boardNumber: b?.number ?? 0,
          userId: b?.userId ?? '',
          userDisplayName: b?.userDisplayName ?? '',
          localGoalPrediction: pred.localGoalPrediction,
          visitorGoalPrediction: pred.visitorGoalPrediction,
          points: pred.points
        }
      }).sort((a, b) => b.points - a.points)
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
                  {{ match.localGoals ?? '-' }}
                </span>
                <span class="text-primary-500 font-black text-xl">:</span>
                <span class="font-heading text-4xl font-black text-(--ui-text-highlighted) tabular-nums">
                  {{ match.visitorGoals ?? '-' }}
                </span>
              </div>
              <UBadge
                v-if="match.isClosed"
                color="neutral"
                variant="soft"
                size="sm"
                class="font-bold uppercase tracking-widest text-[10px] rounded-full"
              >
                Finalizado
              </UBadge>
              <div
                v-else-if="match.isActive"
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
              Predicciones de la Liga
            </h2>
            <UBadge
              color="primary"
              variant="soft"
              class="rounded-lg font-bold"
            >
              {{ predictions.length }} Tablas
            </UBadge>
          </div>

          <div class="card-elevated overflow-hidden stagger-up stagger-d1">
            <table class="w-full">
              <thead>
                <tr class="bg-(--ui-bg-muted)/50 border-b border-(--ui-border)">
                  <th class="text-left px-4 py-3 font-heading text-[11px] font-black text-(--ui-text-muted) uppercase tracking-widest">
                    Participante
                  </th>
                  <th class="text-center px-4 py-3 font-heading text-[11px] font-black text-(--ui-text-muted) uppercase tracking-widest">
                    Pronóstico
                  </th>
                  <th class="text-right px-4 py-3 font-heading text-[11px] font-black text-(--ui-text-muted) uppercase tracking-widest">
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
                    pred.userId === authStore.user?.id ? 'bg-primary-500/5 dark:bg-primary-400/5' : ''
                  ]"
                >
                  <td class="px-4 py-3.5">
                    <div class="flex items-center gap-3 min-w-0">
                      <div
                        class="size-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm shrink-0"
                        :class="[
                          pred.userId === authStore.user?.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-(--ui-bg-muted) text-(--ui-text-muted)'
                        ]"
                      >
                        {{ pred.userDisplayName?.charAt(0).toUpperCase() || '?' }}
                      </div>
                      <div class="min-w-0">
                        <p
                          class="text-sm font-bold truncate"
                          :class="pred.userId === authStore.user?.id ? 'text-primary-600 dark:text-primary-400' : 'text-(--ui-text-highlighted)'"
                        >
                          {{ pred.userDisplayName }}
                        </p>
                        <p class="text-[10px] text-(--ui-text-muted) font-mono uppercase tracking-tighter">
                          Tabla #{{ pred.boardNumber }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <span class="font-heading text-base font-black text-(--ui-text-highlighted) tabular-nums tracking-wider bg-(--ui-bg-muted) px-2.5 py-1 rounded-lg border border-(--ui-border)/50">
                      {{ pred.localGoalPrediction ?? '-' }} - {{ pred.visitorGoalPrediction ?? '-' }}
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-right">
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
