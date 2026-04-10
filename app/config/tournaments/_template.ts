import type { TournamentThemeConfig } from '~/types/tournament-theme'

/**
 * Template para configurar un nuevo torneo.
 * Copiar este archivo, renombrarlo con el id del torneo y completar todos los campos.
 *
 * Pasos:
 * 1. cp _template.ts <id-del-torneo>.ts
 * 2. Completar todos los campos marcados con TODO
 * 3. Generar las 11 tonalidades (50–950) para cada color con una herramienta como:
 *    https://uicolors.app/create o https://www.tints.dev/
 * 4. Subir assets a app/assets/img/tournaments/<id>/
 * 5. En app.vue cambiar el import al nuevo archivo
 */
export const tournamentTemplate: TournamentThemeConfig = {
  id: 'TODO', // ej: 'mundial2030', 'copaamerica2024'
  name: 'TODO', // ej: 'Copa Mundial de Fútbol 2030'
  shortName: 'TODO', // ej: 'Mundial 2030'
  edition: 'TODO', // ej: 'FIFA World Cup 2030'
  season: 'TODO', // ej: '2030'
  sport: 'football',
  hosts: [], // ej: ['España', 'Portugal', 'Marruecos']

  palette: {
    primary: {
      50: '#TODO',
      100: '#TODO',
      200: '#TODO',
      300: '#TODO',
      400: '#TODO',
      500: '#TODO', // Color principal de marca
      600: '#TODO',
      700: '#TODO',
      800: '#TODO',
      900: '#TODO',
      950: '#TODO'
    },
    secondary: {
      50: '#TODO',
      100: '#TODO',
      200: '#TODO',
      300: '#TODO',
      400: '#TODO',
      500: '#TODO', // Color secundario (éxito, confirmaciones)
      600: '#TODO',
      700: '#TODO',
      800: '#TODO',
      900: '#TODO',
      950: '#TODO'
    },
    error: {
      50: '#TODO',
      100: '#TODO',
      200: '#TODO',
      300: '#TODO',
      400: '#TODO',
      500: '#TODO', // Color de error / acento del usuario actual
      600: '#TODO',
      700: '#TODO',
      800: '#TODO',
      900: '#TODO',
      950: '#TODO'
    },
    neutral: {
      50: '#TODO',
      100: '#TODO',
      200: '#TODO',
      300: '#TODO',
      400: '#TODO',
      500: '#TODO', // Color base de grises
      600: '#TODO',
      700: '#TODO',
      800: '#TODO',
      900: '#TODO',
      950: '#TODO'
    }
  },

  assets: {
    bannerLight: '/img/tournaments/TODO/banner-light.jpg',
    bannerDark: '/img/tournaments/TODO/banner-dark.jpg',
    logo: '/img/tournaments/TODO/logo.svg',
    favicon: '/img/tournaments/TODO/favicon.ico',
    loginBg: '/img/tournaments/TODO/login-bg.jpg'
  },

  typography: {
    fontFamily: 'Inter, sans-serif',
    headingWeight: '700'
  },

  meta: {
    startDate: 'TODO', // 'YYYY-MM-DD'
    endDate: 'TODO', // 'YYYY-MM-DD'
    totalMatches: 0,
    totalTeams: 0,
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
