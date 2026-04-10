/**
 * useTournamentTheme — Aplica el tema visual del torneo activo
 */
import { tournamentThemeService } from '~/services/tournament-theme.service'
import type { TournamentThemeConfig } from '~/types/tournament-theme'

export function useTournamentTheme(config: TournamentThemeConfig) {
  const colorMode = useColorMode()

  const themeColor = computed(() =>
    tournamentThemeService.getThemeColor(config, colorMode.value === 'dark')
  )

  onMounted(() => {
    tournamentThemeService.apply(config)
  })

  watch(() => colorMode.value, () => {
    tournamentThemeService.apply(config)
  })

  onUnmounted(() => {
    // No resetear al desmontar — el tema debe persistir en toda la app
  })

  return { themeColor, config }
}
