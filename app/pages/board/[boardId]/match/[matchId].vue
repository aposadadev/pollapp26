<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/es'
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
const matchService = await import('~/services/match.service')
const { getMatchPredictions } = useMatches('') // tournamentId no necesario aquí

const match = ref<import('~/types').Match | null>(null)
const predictions = ref<MatchPredictionEntry[]>([])
const loading = ref(true)

onMounted(async () => {
  appStore.setPageTitle('Detalle del partido')
  await loadBoard(boardId.value)

  const [matchData] = await Promise.all([
    matchService.matchService.findById(matchId.value)
  ])

  match.value = matchData

  if (board.value?.groupId) {
    predictions.value = await getMatchPredictions(matchId.value, board.value.groupId)
  }

  loading.value = false
})

const formattedDate = computed(() =>
  match.value ? dayjs(match.value.date).format('dddd D [de] MMMM [·] HH:mm') : ''
)
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Partido -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton class="h-28 rounded-xl" />
      <USkeleton
        v-for="i in 4"
        :key="i"
        class="h-12 rounded-lg"
      />
    </div>

    <template v-else>
      <!-- Info del partido -->
      <UCard v-if="match">
        <template #header>
          <div class="flex items-center justify-between text-xs text-(--ui-text-muted)">
            <span class="font-medium">{{ match.phase }}</span>
            <span class="capitalize">{{ formattedDate }}</span>
          </div>
        </template>

        <div class="flex items-center justify-center gap-6 py-2">
          <div class="flex flex-col items-center gap-2 flex-1">
            <MatchTeamLogo
              :logo-url="match.localTeamLogo"
              :name="match.localTeamName ?? ''"
              size="lg"
            />
            <span class="text-sm font-semibold text-center">{{ match.localTeamName }}</span>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold tabular-nums text-(--ui-text-highlighted)">
              {{ match.localGoals ?? '?' }} - {{ match.visitorGoals ?? '?' }}
            </p>
            <p class="text-xs text-(--ui-text-muted) mt-1">
              Resultado
            </p>
          </div>
          <div class="flex flex-col items-center gap-2 flex-1">
            <MatchTeamLogo
              :logo-url="match.visitorTeamLogo"
              :name="match.visitorTeamName ?? ''"
              size="lg"
            />
            <span class="text-sm font-semibold text-center">{{ match.visitorTeamName }}</span>
          </div>
        </div>
      </UCard>

      <!-- Predicciones del grupo -->
      <div>
        <h2 class="text-sm font-semibold text-(--ui-text-highlighted) mb-3">
          Predicciones del grupo
        </h2>
        <div class="overflow-x-auto rounded-xl border border-(--ui-border)">
          <table class="w-full text-sm">
            <thead class="bg-(--ui-bg-elevated)">
              <tr>
                <th class="text-left px-3 py-2.5 text-xs font-semibold text-(--ui-text-muted)">
                  Jugador
                </th>
                <th class="text-center px-3 py-2.5 text-xs font-semibold text-(--ui-text-muted)">
                  Predicción
                </th>
                <th class="text-right px-3 py-2.5 text-xs font-semibold text-(--ui-text-muted)">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-(--ui-border)">
              <tr
                v-for="pred in predictions"
                :key="pred.boardId"
                class="transition-colors"
                :class="pred.userId === authStore.user?.id ? 'row-current-user' : 'hover:bg-(--ui-bg-muted)'"
              >
                <td class="px-3 py-2.5">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-xs text-(--ui-text-muted) font-mono shrink-0">#{{ pred.boardNumber }}</span>
                    <span class="font-medium text-(--ui-text-highlighted) truncate">{{ pred.userDisplayName }}</span>
                    <UBadge
                      v-if="pred.userId === authStore.user?.id"
                      color="error"
                      variant="soft"
                      size="xs"
                      class="shrink-0"
                    >
                      Tú
                    </UBadge>
                  </div>
                </td>
                <td class="px-3 py-2.5 text-center font-bold tabular-nums text-(--ui-text-highlighted)">
                  {{ pred.localGoalPrediction ?? '?' }} - {{ pred.visitorGoalPrediction ?? '?' }}
                </td>
                <td class="px-3 py-2.5 text-right">
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
  </div>
</template>
