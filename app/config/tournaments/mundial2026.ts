import type { TournamentThemeConfig } from '~/types/tournament-theme'

/**
 * Configuración del Mundial 2026
 * USA · Canada · México
 *
 * Para crear la configuración de un torneo nuevo:
 * 1. Copiar este archivo como `mundial2030.ts` (o el nombre del torneo)
 * 2. Reemplazar la paleta de colores, los assets y los metadatos
 * 3. En app.vue cambiar el import a la nueva configuración
 * 4. Subir los nuevos assets a app/assets/img/tournaments/<id>/
 */
export const mundial2026: TournamentThemeConfig = {
  id: 'mundial2026',
  name: 'Copa Mundial de Fútbol 2026',
  shortName: 'Mundial 2026',
  edition: 'FIFA World Cup 2026',
  season: '2026',
  sport: 'football',
  hosts: ['USA', 'Canada', 'México'],

  // ── Paleta de colores oficial FIFA World Cup 2026 ─────────────────────────
  // Verde Promedio:       #3CAC3B  → secondary (éxito, puntos, confirmaciones)
  // Hermes Azul Profundo: #2A398D  → primary   (CTAs, nav activo, marca)
  // Rojo Linterna:        #E61D25  → error      (usuario actual, errores, alertas)
  // Gris Claro:           #D1D4D1  → accent     (superficies, separadores)
  // Gris Oscuro Heather:  #474A4A  → neutral    (textos, bordes, bg)
  palette: {
    primary: {
      50: '#e8edfa',
      100: '#c5d0f4',
      200: '#97abea',
      300: '#6985df',
      400: '#4363d0',
      500: '#2D47A8',
      600: '#243988',
      700: '#1b2b66',
      800: '#121d44',
      900: '#0a1028',
      950: '#050815'
    },
    secondary: {
      50: '#e5f9e5',
      100: '#c0f1bf',
      200: '#82e381',
      300: '#52d451',
      400: '#34c433',
      500: '#28A527',
      600: '#1f841e',
      700: '#176317',
      800: '#104810',
      900: '#0a2f0a',
      950: '#071f07'
    },
    error: {
      50: '#fef2f2',
      100: '#fddada',
      200: '#fab5b5',
      300: '#f79090',
      400: '#f46b6b',
      500: '#E61D25',
      600: '#b8171d',
      700: '#8a1116',
      800: '#5c0b0f',
      900: '#2e0608',
      950: '#170304'
    },
    neutral: {
      50: '#f2f3f3',
      100: '#e0e1e1',
      200: '#c1c2c2',
      300: '#a2a4a4',
      400: '#848686',
      500: '#474A4A',
      600: '#3b3e3e',
      700: '#2f3131',
      800: '#232525',
      900: '#181a1a',
      950: '#0c0d0d'
    }
  },

  // ── Assets ────────────────────────────────────────────────────────────────
  // Agregar las imágenes en: app/assets/img/tournaments/mundial2026/
  assets: {
    bannerLight: '/img/tournaments/mundial2026/banner-light.jpg',
    bannerDark: '/img/tournaments/mundial2026/banner-dark.jpg',
    logo: '/img/tournaments/mundial2026/logo.svg',
    favicon: '/img/tournaments/mundial2026/favicon.ico',
    loginBg: '/img/tournaments/mundial2026/login-bg.jpg'
  },

  // ── Tipografía ────────────────────────────────────────────────────────────
  typography: {
    fontFamily: 'Inter, sans-serif',
    headingWeight: '700'
  },

  // ── Metadatos del torneo ──────────────────────────────────────────────────
  meta: {
    startDate: '2026-06-11',
    endDate: '2026-07-19',
    totalMatches: 104,
    totalTeams: 48,
    phases: [
      'Fase de Grupos',
      'Octavos de Final',
      'Cuartos de Final',
      'Semifinales',
      'Tercer Lugar',
      'Final'
    ]
  }
}
