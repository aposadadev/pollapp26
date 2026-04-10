/**
 * usePredictions — Composable de predicciones
 */
import { predictionService } from '~/services/prediction.service'
import type { PredictionWithMatch } from '~/types'

export function usePredictions(boardId: string) {
  const toast = useToast()

  const predictions = ref<PredictionWithMatch[]>([])
  const loading = ref(false)
  const saving = ref<string | null>(null) // predictionId que se está guardando

  const upcoming = computed(() => predictionService.getUpcoming(predictions.value))
  const previous = computed(() => predictionService.getPrevious(predictions.value))

  async function load(): Promise<void> {
    loading.value = true
    try {
      predictions.value = await predictionService.getPredictionsWithMatches(boardId)
    } finally {
      loading.value = false
    }
  }

  async function save(
    predictionId: string,
    localGoalPrediction: number,
    visitorGoalPrediction: number
  ): Promise<boolean> {
    saving.value = predictionId
    try {
      await predictionService.savePrediction(predictionId, localGoalPrediction, visitorGoalPrediction)

      // Actualización optimista en memoria
      const idx = predictions.value.findIndex(p => p.id === predictionId)
      if (idx !== -1) {
        predictions.value[idx] = {
          ...predictions.value[idx]!,
          localGoalPrediction,
          visitorGoalPrediction
        }
      }

      toast.add({ title: 'Predicción guardada', color: 'secondary', duration: 2000 })
      return true
    } catch (err: unknown) {
      toast.add({ title: 'No se pudo guardar', description: (err as Error).message, color: 'error' })
      return false
    } finally {
      saving.value = null
    }
  }

  function randomize(predictionId: string): { local: number, visitor: number } {
    const random = predictionService.generateRandom()
    const idx = predictions.value.findIndex(p => p.id === predictionId)
    if (idx !== -1) {
      predictions.value[idx] = {
        ...predictions.value[idx]!,
        localGoalPrediction: random.local,
        visitorGoalPrediction: random.visitor
      }
    }
    return random
  }

  return {
    predictions: readonly(predictions),
    upcoming,
    previous,
    loading: readonly(loading),
    saving: readonly(saving),
    load,
    save,
    randomize
  }
}
