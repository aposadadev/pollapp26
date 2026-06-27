<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { predictionService } from '~/services/prediction.service'
import type { PredictionWithMatch } from '~/types'

interface Props {
  open: boolean
  boardId: string | null
  userName: string
  userPhoto: string
  boardNumber: number
  totalPoints: number
  currentPos: number
  predsThreePoints: number
  predsOnePoints: number
  totalTeamsGuessed: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const loading = ref(false)
const predictions = ref<PredictionWithMatch[]>([])
const activePhase = ref<string>('Todos')

async function loadData() {
  if (!props.boardId) return
  loading.value = true
  try {
    const list = await predictionService.getRankingsDetailWithMatches(props.boardId)
    // Ordenar por puntos desc, luego por fecha desc
    predictions.value = list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.match.date.getTime() - a.match.date.getTime()
    })
  } catch (err) {
    console.error('[BoardDetailModal] Error loading detail:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    activePhase.value = 'Todos'
    loadData()
  }
})

// Fases disponibles dinámicamente según las predicciones cargadas
const phases = computed(() => {
  const present = new Set(predictions.value.map(p => p.match.phase))
  const orderedPhases = [
    'Fase de Grupos',
    'Dieciseisavos de Final',
    'Octavos de Final',
    'Cuartos de Final',
    'Semifinales',
    'Tercer Lugar',
    'Final'
  ]
  const known = orderedPhases.filter(p => present.has(p))
  const unknown = Array.from(present).filter(p => !orderedPhases.includes(p))
  return ['Todos', ...known, ...unknown]
})

const filteredPredictions = computed(() => {
  if (activePhase.value === 'Todos') return predictions.value
  return predictions.value.filter(p => p.match.phase === activePhase.value)
})
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="flex flex-col h-[85vh] max-h-[700px] overflow-hidden rounded-2xl bg-(--ui-bg-elevated) text-(--ui-text-highlighted) border border-(--ui-border)">
        <!-- Header -->
        <div class="p-4 sm:p-5 flex items-center justify-between border-b border-(--ui-border) shrink-0 bg-(--ui-bg-muted)">
          <div class="flex items-center gap-3 min-w-0">
            <div class="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20 overflow-hidden">
              <img
                v-if="userPhoto"
                :src="userPhoto"
                alt="Avatar"
                class="size-full object-cover"
                referrerpolicy="no-referrer"
              />
              <span v-else class="font-heading font-black text-sm text-primary-600 dark:text-primary-400">
                {{ userName.substring(0, 2).toUpperCase() }}
              </span>
            </div>
            <div class="min-w-0">
              <h3 class="font-heading font-black text-base truncate leading-none mb-1">
                {{ userName }}
              </h3>
              <p class="text-[10px] text-(--ui-text-muted) font-bold uppercase tracking-wider">
                Tabla #{{ boardNumber }}
              </p>
            </div>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            class="rounded-full"
            @click="isOpen = false"
          />
        </div>

        <!-- Info Boxes -->
        <div class="grid grid-cols-4 gap-2 p-4 border-b border-(--ui-border) shrink-0 bg-(--ui-bg-muted)/40">
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border)/50 rounded-xl p-2 text-center flex flex-col justify-center">
            <span class="block text-[10px] text-(--ui-text-muted) font-bold uppercase tracking-wider">Puesto</span>
            <span class="font-heading text-sm sm:text-base font-black text-secondary-500">#{{ currentPos }}</span>
          </div>
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border)/50 rounded-xl p-2 text-center flex flex-col justify-center">
            <span class="block text-[10px] text-(--ui-text-muted) font-bold uppercase tracking-wider">Puntos</span>
            <span class="font-heading text-sm sm:text-base font-black text-primary-500">{{ totalPoints }}</span>
          </div>
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border)/50 rounded-xl p-2 text-center flex flex-col justify-center">
            <span class="block text-[10px] text-(--ui-text-muted) font-bold uppercase tracking-wider">Exactas</span>
            <span class="font-heading text-sm sm:text-base font-black text-emerald-500">{{ predsThreePoints }}</span>
          </div>
          <div class="bg-(--ui-bg-elevated) border border-(--ui-border)/50 rounded-xl p-2 text-center flex flex-col justify-center">
            <span class="block text-[10px] text-(--ui-text-muted) font-bold uppercase tracking-wider">Resultado</span>
            <span class="font-heading text-sm sm:text-base font-black text-amber-500">{{ predsOnePoints }}</span>
          </div>
        </div>

        <!-- Filter bar -->
        <div v-if="!loading && phases.length > 2" class="px-4 py-2 border-b border-(--ui-border) shrink-0 overflow-x-auto flex gap-1.5 scrollbar-hide">
          <button
            v-for="phase in phases"
            :key="phase"
            class="px-2.5 py-1 rounded-full text-[10px] font-heading font-black whitespace-nowrap transition-all uppercase tracking-wider border"
            :class="[
              activePhase === phase
                ? 'bg-secondary-500 text-white border-secondary-500 shadow-sm shadow-secondary-500/20'
                : 'bg-(--ui-bg-muted) text-(--ui-text-muted) border-(--ui-border) hover:bg-(--ui-bg-muted)/80'
            ]"
            @click="activePhase = phase"
          >
            {{ phase }}
          </button>
        </div>

        <!-- Body / Content -->
        <div class="flex-1 overflow-y-auto p-2 sm:p-4">
          <!-- Loading State -->
          <div v-if="loading" class="space-y-2">
            <USkeleton v-for="i in 6" :key="i" class="h-10 rounded-lg w-full" />
          </div>

          <!-- Empty State -->
          <div v-else-if="!filteredPredictions.length" class="text-center py-12">
            <UIcon name="i-lucide-trophy" class="size-12 mx-auto text-(--ui-text-muted)/40 mb-3" />
            <p class="font-heading font-bold text-sm text-(--ui-text-muted) uppercase tracking-wider">
              Sin aciertos en esta fase
            </p>
          </div>

          <!-- Predictions Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse table-fixed">
              <thead>
                <tr class="border-b border-(--ui-border) text-[10px] text-(--ui-text-muted) font-bold uppercase tracking-wider bg-(--ui-bg-muted)/30">
                  <th class="py-2.5 px-1.5 sm:px-3">Partido</th>
                  <th class="py-2.5 px-1 text-center w-14 sm:w-16">Real</th>
                  <th class="py-2.5 px-1 text-center w-14 sm:w-16">Pron.</th>
                  <th class="py-2.5 px-1.5 sm:px-3 text-right w-16 sm:w-20">Pts</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pred in filteredPredictions"
                  :key="pred.id"
                  class="border-b border-(--ui-border)/40 hover:bg-(--ui-bg-muted)/30 transition-colors"
                >
                  <td class="py-2.5 px-1.5 sm:px-3 min-w-0">
                    <div class="flex flex-col min-w-0">
                      <div class="flex items-center gap-1 text-xs font-black text-(--ui-text-highlighted) leading-none">
                        <span class="max-w-[65px] sm:max-w-[120px] truncate text-right">
                          {{ pred.match.localTeamName }}
                        </span>
                        <span class="text-[10px] text-(--ui-text-muted) font-normal">vs</span>
                        <span class="max-w-[65px] sm:max-w-[120px] truncate">
                          {{ pred.match.visitorTeamName }}
                        </span>
                      </div>
                      <span class="text-[9px] text-(--ui-text-muted) font-bold uppercase tracking-wider mt-1">
                        #{{ pred.match.matchNumber }} · {{ pred.match.phase }}
                      </span>
                    </div>
                  </td>
                  <td class="py-2.5 px-1 text-center font-heading text-xs font-black text-(--ui-text-highlighted) w-14 sm:w-16">
                    {{ (pred.match.localGoals ?? 0) + (pred.match.localGoalsOT ?? 0) }} - {{ (pred.match.visitorGoals ?? 0) + (pred.match.visitorGoalsOT ?? 0) }}
                  </td>
                  <td class="py-2.5 px-1 text-center font-heading text-xs font-black text-primary-500 w-14 sm:w-16">
                    {{ pred.localGoalPrediction }} - {{ pred.visitorGoalPrediction }}
                  </td>
                  <td class="py-2.5 px-1.5 sm:px-3 text-right w-16 sm:w-20">
                    <MatchResultBadge :points="pred.points" size="sm" hide-icon />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
