export interface ColorShades {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

export interface TournamentPalette {
  primary: ColorShades
  secondary: ColorShades
  error: ColorShades
  neutral: ColorShades
}

export interface TournamentAssets {
  bannerLight: string
  bannerDark: string
  logo: string
  favicon: string
  loginBg: string
}

export interface TournamentTypography {
  fontFamily: string
  headingWeight: string
}

export interface TournamentMeta {
  startDate: string
  endDate: string
  totalMatches: number
  totalTeams: number
  phases: string[]
}

export interface TournamentThemeConfig {
  id: string
  name: string
  shortName: string
  edition: string
  season: string
  sport: string
  hosts: string[]
  palette: TournamentPalette
  assets: TournamentAssets
  typography: TournamentTypography
  meta: TournamentMeta
}
