/**
 * seed-tournament.ts — Data oficial del torneo
 *
 * Crea los 48 equipos y los 104 partidos del Mundial 2026 usando Firebase Admin SDK.
 *
 * Uso: pnpm seed:tournament
 */
import { initializeApp as initAdminApp, cert, getApps as getAdminApps } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

// ── Env loader ────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const env = readFileSync('.env', 'utf-8')
    env.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length && !key.startsWith('#')) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    })
  } catch { /* ignore */ }
}

loadEnv()

const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const adminClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const adminPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const databaseURL = process.env.FIREBASE_DATABASE_URL

if (!adminProjectId || !adminClientEmail || !adminPrivateKey) {
  console.error('❌ ERROR: Faltan credenciales de Firebase Admin en .env')
  process.exit(1)
}

const adminApp = getAdminApps().length
  ? getAdminApps()[0]!
  : initAdminApp({
      credential: cert({
        projectId: adminProjectId,
        clientEmail: adminClientEmail,
        privateKey: adminPrivateKey
      }),
      databaseURL
    })

const db = getAdminFirestore(adminApp)

const TOURNAMENT_ID = 'mundial2026'

// ── EQUIPOS OFICIALES (48 + TBD) ──────────────────────────────────────────────
const TEAMS: Array<{ name: string, shortName: string, country: string, logoUrl: string }> = [
  // Grupo A
  { name: 'México', shortName: 'MEX', country: 'MX', logoUrl: '' },
  { name: 'Corea del Sur', shortName: 'KOR', country: 'KR', logoUrl: '' },
  { name: 'Sudáfrica', shortName: 'RSA', country: 'ZA', logoUrl: '' },
  { name: 'República Checa', shortName: 'CZE', country: 'CZ', logoUrl: '' },
  // Grupo B
  { name: 'Canadá', shortName: 'CAN', country: 'CA', logoUrl: '' },
  { name: 'Suiza', shortName: 'SUI', country: 'CH', logoUrl: '' },
  { name: 'Qatar', shortName: 'QAT', country: 'QA', logoUrl: '' },
  { name: 'Bosnia-Herzegovina', shortName: 'BIH', country: 'BA', logoUrl: '' },
  // Grupo C
  { name: 'Brasil', shortName: 'BRA', country: 'BR', logoUrl: '' },
  { name: 'Marruecos', shortName: 'MAR', country: 'MA', logoUrl: '' },
  { name: 'Escocia', shortName: 'SCO', country: 'GB-SCT', logoUrl: '' },
  { name: 'Haití', shortName: 'HAI', country: 'HT', logoUrl: '' },
  // Grupo D
  { name: 'Estados Unidos', shortName: 'USA', country: 'US', logoUrl: '' },
  { name: 'Paraguay', shortName: 'PAR', country: 'PY', logoUrl: '' },
  { name: 'Australia', shortName: 'AUS', country: 'AU', logoUrl: '' },
  { name: 'Turquía', shortName: 'TUR', country: 'TR', logoUrl: '' },
  // Grupo E
  { name: 'Alemania', shortName: 'GER', country: 'DE', logoUrl: '' },
  { name: 'Ecuador', shortName: 'ECU', country: 'EC', logoUrl: '' },
  { name: 'Costa de Marfil', shortName: 'CIV', country: 'CI', logoUrl: '' },
  { name: 'Curazao', shortName: 'CUW', country: 'CW', logoUrl: '' },
  // Grupo F
  { name: 'Países Bajos', shortName: 'NED', country: 'NL', logoUrl: '' },
  { name: 'Japón', shortName: 'JPN', country: 'JP', logoUrl: '' },
  { name: 'Túnez', shortName: 'TUN', country: 'TN', logoUrl: '' },
  { name: 'Suecia', shortName: 'SWE', country: 'SE', logoUrl: '' },
  // Grupo G
  { name: 'Bélgica', shortName: 'BEL', country: 'BE', logoUrl: '' },
  { name: 'Irán', shortName: 'IRN', country: 'IR', logoUrl: '' },
  { name: 'Egipto', shortName: 'EGY', country: 'EG', logoUrl: '' },
  { name: 'Nueva Zelanda', shortName: 'NZL', country: 'NZ', logoUrl: '' },
  // Grupo H
  { name: 'España', shortName: 'ESP', country: 'ES', logoUrl: '' },
  { name: 'Uruguay', shortName: 'URU', country: 'UY', logoUrl: '' },
  { name: 'Arabia Saudita', shortName: 'KSA', country: 'SA', logoUrl: '' },
  { name: 'Cabo Verde', shortName: 'CPV', country: 'CV', logoUrl: '' },
  // Grupo I
  { name: 'Francia', shortName: 'FRA', country: 'FR', logoUrl: '' },
  { name: 'Senegal', shortName: 'SEN', country: 'SN', logoUrl: '' },
  { name: 'Irak', shortName: 'IRQ', country: 'IQ', logoUrl: '' },
  { name: 'Noruega', shortName: 'NOR', country: 'NO', logoUrl: '' },
  // Grupo J
  { name: 'Argentina', shortName: 'ARG', country: 'AR', logoUrl: '' },
  { name: 'Argelia', shortName: 'ALG', country: 'DZ', logoUrl: '' },
  { name: 'Austria', shortName: 'AUT', country: 'AT', logoUrl: '' },
  { name: 'Jordania', shortName: 'JOR', country: 'JO', logoUrl: '' },
  // Grupo K
  { name: 'Portugal', shortName: 'POR', country: 'PT', logoUrl: '' },
  { name: 'Colombia', shortName: 'COL', country: 'CO', logoUrl: '' },
  { name: 'Uzbekistán', shortName: 'UZB', country: 'UZ', logoUrl: '' },
  { name: 'RD del Congo', shortName: 'COD', country: 'CD', logoUrl: '' },
  // Grupo L
  { name: 'Inglaterra', shortName: 'ENG', country: 'GB-ENG', logoUrl: '' },
  { name: 'Croacia', shortName: 'CRO', country: 'HR', logoUrl: '' },
  { name: 'Ghana', shortName: 'GHA', country: 'GH', logoUrl: '' },
  { name: 'Panamá', shortName: 'PAN', country: 'PA', logoUrl: '' },
  // Placeholder para fases eliminatorias
  { name: 'TBD', shortName: 'TBD', country: '', logoUrl: '' }
]

type MatchPhase
  = | 'Fase de Grupos'
    | 'Dieciseisavos de Final'
    | 'Octavos de Final'
    | 'Cuartos de Final'
    | 'Semifinales'
    | 'Tercer Lugar'
    | 'Final'

interface RealMatchDef {
  matchNumber: number
  localTeam: string
  visitorTeam: string
  date: string
  phase: MatchPhase
  stadium: string
}

const REAL_MATCHES: RealMatchDef[] = [
  { matchNumber: 1, localTeam: 'MEX', visitorTeam: 'RSA', date: '2026-06-11T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Ciudad de México' },
  { matchNumber: 2, localTeam: 'KOR', visitorTeam: 'CZE', date: '2026-06-12T02:00:00Z', phase: 'Fase de Grupos', stadium: 'Guadalajara' },
  { matchNumber: 3, localTeam: 'CAN', visitorTeam: 'BIH', date: '2026-06-12T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Toronto' },
  { matchNumber: 4, localTeam: 'USA', visitorTeam: 'PAR', date: '2026-06-13T01:00:00Z', phase: 'Fase de Grupos', stadium: 'Los Ángeles' },
  { matchNumber: 5, localTeam: 'HAI', visitorTeam: 'SCO', date: '2026-06-14T01:00:00Z', phase: 'Fase de Grupos', stadium: 'Boston' },
  { matchNumber: 6, localTeam: 'AUS', visitorTeam: 'TUR', date: '2026-06-14T04:00:00Z', phase: 'Fase de Grupos', stadium: 'Vancouver' },
  { matchNumber: 7, localTeam: 'BRA', visitorTeam: 'MAR', date: '2026-06-13T22:00:00Z', phase: 'Fase de Grupos', stadium: 'Nueva York / Nueva Jersey' },
  { matchNumber: 8, localTeam: 'QAT', visitorTeam: 'SUI', date: '2026-06-13T19:00:00Z', phase: 'Fase de Grupos', stadium: 'San Francisco' },
  { matchNumber: 9, localTeam: 'CIV', visitorTeam: 'ECU', date: '2026-06-14T23:00:00Z', phase: 'Fase de Grupos', stadium: 'Philadelphia' },
  { matchNumber: 10, localTeam: 'GER', visitorTeam: 'CUW', date: '2026-06-14T17:00:00Z', phase: 'Fase de Grupos', stadium: 'Houston' },
  { matchNumber: 11, localTeam: 'NED', visitorTeam: 'JPN', date: '2026-06-14T20:00:00Z', phase: 'Fase de Grupos', stadium: 'Dallas' },
  { matchNumber: 12, localTeam: 'SWE', visitorTeam: 'TUN', date: '2026-06-15T02:00:00Z', phase: 'Fase de Grupos', stadium: 'Monterrey' },
  { matchNumber: 13, localTeam: 'KSA', visitorTeam: 'URU', date: '2026-06-15T22:00:00Z', phase: 'Fase de Grupos', stadium: 'Miami' },
  { matchNumber: 14, localTeam: 'ESP', visitorTeam: 'CPV', date: '2026-06-15T16:00:00Z', phase: 'Fase de Grupos', stadium: 'Atlanta' },
  { matchNumber: 15, localTeam: 'IRN', visitorTeam: 'NZL', date: '2026-06-16T01:00:00Z', phase: 'Fase de Grupos', stadium: 'Los Ángeles' },
  { matchNumber: 16, localTeam: 'BEL', visitorTeam: 'EGY', date: '2026-06-15T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Seattle' },
  { matchNumber: 17, localTeam: 'FRA', visitorTeam: 'SEN', date: '2026-06-16T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Nueva York / Nueva Jersey' },
  { matchNumber: 18, localTeam: 'IRQ', visitorTeam: 'NOR', date: '2026-06-16T22:00:00Z', phase: 'Fase de Grupos', stadium: 'Boston' },
  { matchNumber: 19, localTeam: 'ARG', visitorTeam: 'ALG', date: '2026-06-17T01:00:00Z', phase: 'Fase de Grupos', stadium: 'Kansas City' },
  { matchNumber: 20, localTeam: 'AUT', visitorTeam: 'JOR', date: '2026-06-17T04:00:00Z', phase: 'Fase de Grupos', stadium: 'San Francisco' },
  { matchNumber: 21, localTeam: 'GHA', visitorTeam: 'PAN', date: '2026-06-17T23:00:00Z', phase: 'Fase de Grupos', stadium: 'Toronto' },
  { matchNumber: 22, localTeam: 'ENG', visitorTeam: 'CRO', date: '2026-06-17T20:00:00Z', phase: 'Fase de Grupos', stadium: 'Dallas' },
  { matchNumber: 23, localTeam: 'POR', visitorTeam: 'COD', date: '2026-06-17T17:00:00Z', phase: 'Fase de Grupos', stadium: 'Houston' },
  { matchNumber: 24, localTeam: 'UZB', visitorTeam: 'COL', date: '2026-06-18T02:00:00Z', phase: 'Fase de Grupos', stadium: 'Ciudad de México' },
  { matchNumber: 25, localTeam: 'CZE', visitorTeam: 'RSA', date: '2026-06-18T16:00:00Z', phase: 'Fase de Grupos', stadium: 'Atlanta' },
  { matchNumber: 26, localTeam: 'SUI', visitorTeam: 'BIH', date: '2026-06-18T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Los Ángeles' },
  { matchNumber: 27, localTeam: 'CAN', visitorTeam: 'QAT', date: '2026-06-18T22:00:00Z', phase: 'Fase de Grupos', stadium: 'Vancouver' },
  { matchNumber: 28, localTeam: 'MEX', visitorTeam: 'KOR', date: '2026-06-19T01:00:00Z', phase: 'Fase de Grupos', stadium: 'Guadalajara' },
  { matchNumber: 29, localTeam: 'BRA', visitorTeam: 'HAI', date: '2026-06-20T00:30:00Z', phase: 'Fase de Grupos', stadium: 'Philadelphia' },
  { matchNumber: 30, localTeam: 'SCO', visitorTeam: 'MAR', date: '2026-06-19T22:00:00Z', phase: 'Fase de Grupos', stadium: 'Boston' },
  { matchNumber: 31, localTeam: 'TUR', visitorTeam: 'PAR', date: '2026-06-20T03:00:00Z', phase: 'Fase de Grupos', stadium: 'San Francisco' },
  { matchNumber: 32, localTeam: 'USA', visitorTeam: 'AUS', date: '2026-06-19T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Seattle' },
  { matchNumber: 33, localTeam: 'GER', visitorTeam: 'CIV', date: '2026-06-20T20:00:00Z', phase: 'Fase de Grupos', stadium: 'Toronto' },
  { matchNumber: 34, localTeam: 'ECU', visitorTeam: 'CUW', date: '2026-06-21T00:00:00Z', phase: 'Fase de Grupos', stadium: 'Kansas City' },
  { matchNumber: 35, localTeam: 'NED', visitorTeam: 'SWE', date: '2026-06-20T17:00:00Z', phase: 'Fase de Grupos', stadium: 'Houston' },
  { matchNumber: 36, localTeam: 'TUN', visitorTeam: 'JPN', date: '2026-06-21T04:00:00Z', phase: 'Fase de Grupos', stadium: 'Monterrey' },
  { matchNumber: 37, localTeam: 'URU', visitorTeam: 'CPV', date: '2026-06-21T22:00:00Z', phase: 'Fase de Grupos', stadium: 'Miami' },
  { matchNumber: 38, localTeam: 'ESP', visitorTeam: 'KSA', date: '2026-06-21T16:00:00Z', phase: 'Fase de Grupos', stadium: 'Atlanta' },
  { matchNumber: 39, localTeam: 'BEL', visitorTeam: 'IRN', date: '2026-06-21T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Los Ángeles' },
  { matchNumber: 40, localTeam: 'NZL', visitorTeam: 'EGY', date: '2026-06-22T01:00:00Z', phase: 'Fase de Grupos', stadium: 'Vancouver' },
  { matchNumber: 41, localTeam: 'NOR', visitorTeam: 'SEN', date: '2026-06-23T00:00:00Z', phase: 'Fase de Grupos', stadium: 'Nueva York / Nueva Jersey' },
  { matchNumber: 42, localTeam: 'FRA', visitorTeam: 'IRQ', date: '2026-06-22T21:00:00Z', phase: 'Fase de Grupos', stadium: 'Philadelphia' },
  { matchNumber: 43, localTeam: 'ARG', visitorTeam: 'AUT', date: '2026-06-22T17:00:00Z', phase: 'Fase de Grupos', stadium: 'Dallas' },
  { matchNumber: 44, localTeam: 'JOR', visitorTeam: 'ALG', date: '2026-06-23T03:00:00Z', phase: 'Fase de Grupos', stadium: 'San Francisco' },
  { matchNumber: 45, localTeam: 'ENG', visitorTeam: 'GHA', date: '2026-06-23T20:00:00Z', phase: 'Fase de Grupos', stadium: 'Boston' },
  { matchNumber: 46, localTeam: 'PAN', visitorTeam: 'CRO', date: '2026-06-23T23:00:00Z', phase: 'Fase de Grupos', stadium: 'Toronto' },
  { matchNumber: 47, localTeam: 'POR', visitorTeam: 'UZB', date: '2026-06-23T17:00:00Z', phase: 'Fase de Grupos', stadium: 'Houston' },
  { matchNumber: 48, localTeam: 'COL', visitorTeam: 'COD', date: '2026-06-24T02:00:00Z', phase: 'Fase de Grupos', stadium: 'Guadalajara' },
  { matchNumber: 49, localTeam: 'SCO', visitorTeam: 'BRA', date: '2026-06-24T22:00:00Z', phase: 'Fase de Grupos', stadium: 'Miami' },
  { matchNumber: 50, localTeam: 'MAR', visitorTeam: 'HAI', date: '2026-06-24T22:00:00Z', phase: 'Fase de Grupos', stadium: 'Atlanta' },
  { matchNumber: 51, localTeam: 'SUI', visitorTeam: 'CAN', date: '2026-06-24T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Vancouver' },
  { matchNumber: 52, localTeam: 'BIH', visitorTeam: 'QAT', date: '2026-06-24T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Seattle' },
  { matchNumber: 53, localTeam: 'CZE', visitorTeam: 'MEX', date: '2026-06-25T01:00:00Z', phase: 'Fase de Grupos', stadium: 'Ciudad de México' },
  { matchNumber: 54, localTeam: 'RSA', visitorTeam: 'KOR', date: '2026-06-25T01:00:00Z', phase: 'Fase de Grupos', stadium: 'Monterrey' },
  { matchNumber: 55, localTeam: 'CUW', visitorTeam: 'CIV', date: '2026-06-25T20:00:00Z', phase: 'Fase de Grupos', stadium: 'Philadelphia' },
  { matchNumber: 56, localTeam: 'ECU', visitorTeam: 'GER', date: '2026-06-25T20:00:00Z', phase: 'Fase de Grupos', stadium: 'Nueva York / Nueva Jersey' },
  { matchNumber: 57, localTeam: 'JPN', visitorTeam: 'SWE', date: '2026-06-25T23:00:00Z', phase: 'Fase de Grupos', stadium: 'Dallas' },
  { matchNumber: 58, localTeam: 'TUN', visitorTeam: 'NED', date: '2026-06-25T23:00:00Z', phase: 'Fase de Grupos', stadium: 'Kansas City' },
  { matchNumber: 59, localTeam: 'TUR', visitorTeam: 'USA', date: '2026-06-26T02:00:00Z', phase: 'Fase de Grupos', stadium: 'Los Ángeles' },
  { matchNumber: 60, localTeam: 'PAR', visitorTeam: 'AUS', date: '2026-06-26T02:00:00Z', phase: 'Fase de Grupos', stadium: 'San Francisco' },
  { matchNumber: 61, localTeam: 'NOR', visitorTeam: 'FRA', date: '2026-06-26T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Boston' },
  { matchNumber: 62, localTeam: 'SEN', visitorTeam: 'IRQ', date: '2026-06-26T19:00:00Z', phase: 'Fase de Grupos', stadium: 'Toronto' },
  { matchNumber: 63, localTeam: 'EGY', visitorTeam: 'IRN', date: '2026-06-27T03:00:00Z', phase: 'Fase de Grupos', stadium: 'Seattle' },
  { matchNumber: 64, localTeam: 'NZL', visitorTeam: 'BEL', date: '2026-06-27T03:00:00Z', phase: 'Fase de Grupos', stadium: 'Vancouver' },
  { matchNumber: 65, localTeam: 'CPV', visitorTeam: 'KSA', date: '2026-06-27T00:00:00Z', phase: 'Fase de Grupos', stadium: 'Houston' },
  { matchNumber: 66, localTeam: 'URU', visitorTeam: 'ESP', date: '2026-06-27T00:00:00Z', phase: 'Fase de Grupos', stadium: 'Guadalajara' },
  { matchNumber: 67, localTeam: 'PAN', visitorTeam: 'ENG', date: '2026-06-27T21:00:00Z', phase: 'Fase de Grupos', stadium: 'Nueva York / Nueva Jersey' },
  { matchNumber: 68, localTeam: 'CRO', visitorTeam: 'GHA', date: '2026-06-27T21:00:00Z', phase: 'Fase de Grupos', stadium: 'Philadelphia' },
  { matchNumber: 69, localTeam: 'ALG', visitorTeam: 'AUT', date: '2026-06-28T02:00:00Z', phase: 'Fase de Grupos', stadium: 'Kansas City' },
  { matchNumber: 70, localTeam: 'JOR', visitorTeam: 'ARG', date: '2026-06-28T02:00:00Z', phase: 'Fase de Grupos', stadium: 'Dallas' },
  { matchNumber: 71, localTeam: 'COL', visitorTeam: 'POR', date: '2026-06-27T23:30:00Z', phase: 'Fase de Grupos', stadium: 'Miami' },
  { matchNumber: 72, localTeam: 'COD', visitorTeam: 'UZB', date: '2026-06-27T23:30:00Z', phase: 'Fase de Grupos', stadium: 'Atlanta' },
  { matchNumber: 73, localTeam: '2A', visitorTeam: '2B', date: '2026-06-28T19:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Los Ángeles' },
  { matchNumber: 74, localTeam: '1E', visitorTeam: '3A/B/C/D/F', date: '2026-06-29T20:30:00Z', phase: 'Dieciseisavos de Final', stadium: 'Boston' },
  { matchNumber: 75, localTeam: '1F', visitorTeam: '2C', date: '2026-06-30T01:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Monterrey' },
  { matchNumber: 76, localTeam: '1C', visitorTeam: '2F', date: '2026-06-29T17:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Houston' },
  { matchNumber: 77, localTeam: '1I', visitorTeam: '3C/D/F/G/H', date: '2026-06-30T21:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Nueva York / Nueva Jersey' },
  { matchNumber: 78, localTeam: '2E', visitorTeam: '2I', date: '2026-06-30T17:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Dallas' },
  { matchNumber: 79, localTeam: '1A', visitorTeam: '3C/E/F/H/I', date: '2026-07-01T01:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Ciudad de México' },
  { matchNumber: 80, localTeam: '1L', visitorTeam: '3E/H/I/J/K', date: '2026-07-01T16:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Atlanta' },
  { matchNumber: 81, localTeam: '1D', visitorTeam: '3B/E/F/I/J', date: '2026-07-02T00:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'San Francisco' },
  { matchNumber: 82, localTeam: '1G', visitorTeam: '3A/E/H/I/J', date: '2026-07-01T20:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Seattle' },
  { matchNumber: 83, localTeam: '2K', visitorTeam: '2L', date: '2026-07-02T23:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Toronto' },
  { matchNumber: 84, localTeam: '1H', visitorTeam: '2J', date: '2026-07-02T19:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Los Ángeles' },
  { matchNumber: 85, localTeam: '1B', visitorTeam: '3E/F/G/I/J', date: '2026-07-03T03:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Vancouver' },
  { matchNumber: 86, localTeam: '1J', visitorTeam: '2H', date: '2026-07-03T22:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Miami' },
  { matchNumber: 87, localTeam: '1K', visitorTeam: '3D/E/I/J/L', date: '2026-07-04T01:30:00Z', phase: 'Dieciseisavos de Final', stadium: 'Kansas City' },
  { matchNumber: 88, localTeam: '2D', visitorTeam: '2G', date: '2026-07-03T18:00:00Z', phase: 'Dieciseisavos de Final', stadium: 'Dallas' },
  { matchNumber: 89, localTeam: 'W74', visitorTeam: 'W77', date: '2026-07-04T21:00:00Z', phase: 'Octavos de Final', stadium: 'Philadelphia' },
  { matchNumber: 90, localTeam: 'W73', visitorTeam: 'W75', date: '2026-07-04T17:00:00Z', phase: 'Octavos de Final', stadium: 'Houston' },
  { matchNumber: 91, localTeam: 'W76', visitorTeam: 'W78', date: '2026-07-05T20:00:00Z', phase: 'Octavos de Final', stadium: 'Nueva York / Nueva Jersey' },
  { matchNumber: 92, localTeam: 'W79', visitorTeam: 'W80', date: '2026-07-06T00:00:00Z', phase: 'Octavos de Final', stadium: 'Ciudad de México' },
  { matchNumber: 93, localTeam: 'W83', visitorTeam: 'W84', date: '2026-07-06T19:00:00Z', phase: 'Octavos de Final', stadium: 'Dallas' },
  { matchNumber: 94, localTeam: 'W81', visitorTeam: 'W82', date: '2026-07-07T00:00:00Z', phase: 'Octavos de Final', stadium: 'Seattle' },
  { matchNumber: 95, localTeam: 'W86', visitorTeam: 'W88', date: '2026-07-07T16:00:00Z', phase: 'Octavos de Final', stadium: 'Atlanta' },
  { matchNumber: 96, localTeam: 'W85', visitorTeam: 'W87', date: '2026-07-07T20:00:00Z', phase: 'Octavos de Final', stadium: 'Vancouver' },
  { matchNumber: 97, localTeam: 'W89', visitorTeam: 'W90', date: '2026-07-09T20:00:00Z', phase: 'Cuartos de Final', stadium: 'Boston' },
  { matchNumber: 98, localTeam: 'W93', visitorTeam: 'W94', date: '2026-07-10T19:00:00Z', phase: 'Cuartos de Final', stadium: 'Los Ángeles' },
  { matchNumber: 99, localTeam: 'W91', visitorTeam: 'W92', date: '2026-07-11T21:00:00Z', phase: 'Cuartos de Final', stadium: 'Miami' },
  { matchNumber: 100, localTeam: 'W95', visitorTeam: 'W96', date: '2026-07-12T01:00:00Z', phase: 'Cuartos de Final', stadium: 'Kansas City' },
  { matchNumber: 101, localTeam: 'W97', visitorTeam: 'W98', date: '2026-07-14T19:00:00Z', phase: 'Semifinales', stadium: 'Dallas' },
  { matchNumber: 102, localTeam: 'W99', visitorTeam: 'W100', date: '2026-07-15T19:00:00Z', phase: 'Semifinales', stadium: 'Atlanta' },
  { matchNumber: 103, localTeam: 'L101', visitorTeam: 'L102', date: '2026-07-18T21:00:00Z', phase: 'Tercer Lugar', stadium: 'Miami' },
  { matchNumber: 104, localTeam: 'W101', visitorTeam: 'W102', date: '2026-07-19T19:00:00Z', phase: 'Final', stadium: 'Nueva York / Nueva Jersey' }
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Seed del torneo (Admin SDK) — Equipos y Partidos Oficiales WC 2026\n')
  console.log(`   Proyecto:    ${adminProjectId}`)
  console.log(`   Torneo:      ${TOURNAMENT_ID}\n`)

  try {
    // Equipos
    console.log('📦 Creando equipos en Firestore...')
    const teamIds: string[] = []

    // Usar lotes de Firestore para escribir los equipos de manera eficiente y segura
    const teamsBatch = db.batch()
    const teamRefs = TEAMS.map(() => db.collection('teams').doc())

    TEAMS.forEach((team, i) => {
      const finalLogoUrl = team.logoUrl || (team.country ? `https://flagcdn.com/w80/${team.country.toLowerCase()}.png` : '')
      teamsBatch.set(teamRefs[i], {
        ...team,
        logoUrl: finalLogoUrl,
        tournamentId: TOURNAMENT_ID,
        createdAt: FieldValue.serverTimestamp()
      })
      teamIds.push(teamRefs[i].id)
      if (team.shortName !== 'TBD') {
        console.log(`   ✓ ${team.shortName.padEnd(4)} — ${team.name}`)
      }
    })
    await teamsBatch.commit()
    console.log(`   → ${teamIds.length} equipos creados\n`)

    // Partidos
    console.log('📦 Creando partidos en Firestore...')

    const matchesBatch = db.batch()

    // Crear un mapa de shortName -> index en TEAMS
    const teamShortNameMap = new Map<string, number>()
    TEAMS.forEach((team, idx) => {
      teamShortNameMap.set(team.shortName, idx)
    })
    const TBD_INDEX = teamShortNameMap.get('TBD') ?? 48

    for (const m of REAL_MATCHES) {
      const localIdx = teamShortNameMap.has(m.localTeam) ? teamShortNameMap.get(m.localTeam)! : TBD_INDEX
      const visitorIdx = teamShortNameMap.has(m.visitorTeam) ? teamShortNameMap.get(m.visitorTeam)! : TBD_INDEX

      const local = TEAMS[localIdx]
      const visitor = TEAMS[visitorIdx]
      const localLogo = local.logoUrl || (local.country ? `https://flagcdn.com/w80/${local.country.toLowerCase()}.png` : '')
      const visitorLogo = visitor.logoUrl || (visitor.country ? `https://flagcdn.com/w80/${visitor.country.toLowerCase()}.png` : '')
      const matchDocRef = db.collection('matches').doc()

      matchesBatch.set(matchDocRef, {
        tournamentId: TOURNAMENT_ID,
        localTeamId: teamIds[localIdx],
        visitorTeamId: teamIds[visitorIdx],
        localTeamName: local.name,
        visitorTeamName: visitor.name,
        localTeamLogo: localLogo,
        visitorTeamLogo: visitorLogo,
        localGoals: null,
        visitorGoals: null,
        date: new Date(m.date),
        phase: m.phase,
        matchNumber: m.matchNumber,
        stadium: m.stadium,
        status: 'scheduled',
        isActive: false,
        isClosed: false,
        createdAt: FieldValue.serverTimestamp()
      })

      const label = local.shortName === 'TBD' ? `TBD vs TBD` : `${local.shortName} vs ${visitor.shortName}`
      console.log(`   ✓ #${String(m.matchNumber).padStart(3, '0')} ${m.phase.padEnd(25)} ${label}`)
    }

    await matchesBatch.commit()
    console.log(`   → ${REAL_MATCHES.length} partidos creados\n`)

    console.log('✅ Seed de torneo completado con éxito!')
  } catch (err) {
    console.error('\n❌ Error durante el seed:', err)
    process.exit(1)
  }
}

main()
