/**
 * TournamentThemeService — Aplica la paleta del torneo al DOM
 * Es el único servicio que manipula CSS custom properties.
 * La vista nunca accede a los CSS variables directamente.
 */
import type { TournamentThemeConfig } from '~/types/tournament-theme'

export class TournamentThemeService {
  private readonly colorRoles = ['primary', 'secondary', 'error', 'neutral'] as const
  private readonly shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

  /** Aplica la paleta completa del torneo al elemento raíz */
  apply(config: TournamentThemeConfig): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    for (const role of this.colorRoles) {
      const palette = config.palette[role]
      for (const shade of this.shades) {
        root.style.setProperty(`--ui-color-${role}-${shade}`, palette[shade])
        // También setear como color de Tailwind para que funcionen las clases
        root.style.setProperty(`--color-${role}-${shade}`, palette[shade])
      }
    }

    root.setAttribute('data-tournament', config.id)
  }

  /** Resetea al tema por defecto (elimina los overrides inline) */
  reset(): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    for (const role of this.colorRoles) {
      for (const shade of this.shades) {
        root.style.removeProperty(`--ui-color-${role}-${shade}`)
        root.style.removeProperty(`--color-${role}-${shade}`)
      }
    }

    root.removeAttribute('data-tournament')
  }

  /** Genera el meta tag para el theme-color del navegador */
  getThemeColor(config: TournamentThemeConfig, isDark: boolean): string {
    return isDark ? config.palette.primary[900] : config.palette.primary[500]
  }
}

export const tournamentThemeService = new TournamentThemeService()
