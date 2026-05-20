/**
 * seed-tournament.ts — Data oficial del torneo
 *
 * Crea los 48 equipos y los 104 partidos del Mundial 2026 usando Firebase Admin SDK.
 *
 * Uso: pnpm seed:tournament
 */
import { initializeApp as initAdminApp, cert, getApps as getAdminApps } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
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

type MatchPhase =
  | 'Fase de Grupos'
  | 'Dieciseisavos de Final'
  | 'Octavos de Final'
  | 'Cuartos de Final'
  | 'Semifinales'
  | 'Tercer Lugar'
  | 'Final'

interface MatchDef {
  localIdx: number
  visitorIdx: number
  date: Date
  phase: MatchPhase
  matchNumber: number
}

// Generación de partidos de fase de grupos (72 partidos)
const groupMatches: MatchDef[] = []
const GROUP_START_DATE = new Date('2026-06-11T13:00:00Z')
const HOURS = [13, 16, 19, 22]

let matchCounter = 1

for (let round = 1; round <= 3; round++) {
  for (let g = 0; g < 12; g++) {
    const startIdx = g * 4
    
    // Función auxiliar para obtener la fecha del partido secuencialmente
    const getMatchDate = (index: number) => {
      const dayOffset = Math.floor((index - 1) / 4)
      const slot = (index - 1) % 4
      const d = new Date(GROUP_START_DATE)
      d.setUTCDate(d.getUTCDate() + dayOffset)
      d.setUTCHours(HOURS[slot])
      return d
    }

    if (round === 1) {
      groupMatches.push({
        localIdx: startIdx,
        visitorIdx: startIdx + 1,
        date: getMatchDate(matchCounter),
        phase: 'Fase de Grupos',
        matchNumber: matchCounter++
      })
      groupMatches.push({
        localIdx: startIdx + 2,
        visitorIdx: startIdx + 3,
        date: getMatchDate(matchCounter),
        phase: 'Fase de Grupos',
        matchNumber: matchCounter++
      })
    } else if (round === 2) {
      groupMatches.push({
        localIdx: startIdx,
        visitorIdx: startIdx + 2,
        date: getMatchDate(matchCounter),
        phase: 'Fase de Grupos',
        matchNumber: matchCounter++
      })
      groupMatches.push({
        localIdx: startIdx + 1,
        visitorIdx: startIdx + 3,
        date: getMatchDate(matchCounter),
        phase: 'Fase de Grupos',
        matchNumber: matchCounter++
      })
    } else {
      groupMatches.push({
        localIdx: startIdx,
        visitorIdx: startIdx + 3,
        date: getMatchDate(matchCounter),
        phase: 'Fase de Grupos',
        matchNumber: matchCounter++
      })
      groupMatches.push({
        localIdx: startIdx + 1,
        visitorIdx: startIdx + 2,
        date: getMatchDate(matchCounter),
        phase: 'Fase de Grupos',
        matchNumber: matchCounter++
      })
    }
  }
}

// Definición de partidos de fase de eliminación (32 partidos)
const TBD_INDEX = 48
const knockoutMatchesDefs: Array<{ count: number, phase: MatchPhase, startDateStr: string, hourIntervalHours: number, dailyCount: number }> = [
  { count: 16, phase: 'Dieciseisavos de Final', startDateStr: '2026-06-29T13:00:00Z', hourIntervalHours: 3, dailyCount: 4 },
  { count: 8, phase: 'Octavos de Final', startDateStr: '2026-07-04T16:00:00Z', hourIntervalHours: 4, dailyCount: 2 },
  { count: 4, phase: 'Cuartos de Final', startDateStr: '2026-07-09T16:00:00Z', hourIntervalHours: 4, dailyCount: 2 },
  { count: 2, phase: 'Semifinales', startDateStr: '2026-07-14T20:00:00Z', hourIntervalHours: 24, dailyCount: 1 },
  { count: 1, phase: 'Tercer Lugar', startDateStr: '2026-07-18T20:00:00Z', hourIntervalHours: 0, dailyCount: 1 },
  { count: 1, phase: 'Final', startDateStr: '2026-07-19T20:00:00Z', hourIntervalHours: 0, dailyCount: 1 }
]

const knockoutMatches: MatchDef[] = []
for (const def of knockoutMatchesDefs) {
  const baseDate = new Date(def.startDateStr)
  for (let i = 0; i < def.count; i++) {
    const matchDate = new Date(baseDate)
    if (def.dailyCount === 1) {
      // 1 partido por día
      matchDate.setUTCDate(baseDate.getUTCDate() + i)
    } else {
      // Múltiples partidos por día
      const dayOffset = Math.floor(i / def.dailyCount)
      const slot = i % def.dailyCount
      matchDate.setUTCDate(baseDate.getUTCDate() + dayOffset)
      
      if (def.phase === 'Dieciseisavos de Final') {
        const hours = [13, 16, 19, 22]
        matchDate.setUTCHours(hours[slot])
      } else {
        const hours = [16, 20]
        matchDate.setUTCHours(hours[slot])
      }
    }

    knockoutMatches.push({
      localIdx: TBD_INDEX,
      visitorIdx: TBD_INDEX,
      date: matchDate,
      phase: def.phase,
      matchNumber: matchCounter++
    })
  }
}

const ALL_MATCHES = [...groupMatches, ...knockoutMatches]

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
    
    // Firestore batch admite hasta 500 operaciones por lote. Como son 104 partidos, cabe de sobra en un solo lote!
    const matchesBatch = db.batch()
    
    for (const m of ALL_MATCHES) {
      const local = TEAMS[m.localIdx]
      const visitor = TEAMS[m.visitorIdx]
      const localLogo = local.logoUrl || (local.country ? `https://flagcdn.com/w80/${local.country.toLowerCase()}.png` : '')
      const visitorLogo = visitor.logoUrl || (visitor.country ? `https://flagcdn.com/w80/${visitor.country.toLowerCase()}.png` : '')
      const matchDocRef = db.collection('matches').doc()
      
      matchesBatch.set(matchDocRef, {
        tournamentId: TOURNAMENT_ID,
        localTeamId: teamIds[m.localIdx],
        visitorTeamId: teamIds[m.visitorIdx],
        localTeamName: local.name,
        visitorTeamName: visitor.name,
        localTeamLogo: localLogo,
        visitorTeamLogo: visitorLogo,
        localGoals: null,
        visitorGoals: null,
        date: m.date,
        phase: m.phase,
        matchNumber: m.matchNumber,
        status: 'scheduled',
        isActive: false,
        isClosed: false,
        createdAt: FieldValue.serverTimestamp()
      })
      
      const label = local.shortName === 'TBD' ? `TBD vs TBD` : `${local.shortName} vs ${visitor.shortName}`
      console.log(`   ✓ #${String(m.matchNumber).padStart(3, '0')} ${m.phase.padEnd(25)} ${label}`)
    }
    
    await matchesBatch.commit()
    console.log(`   → ${ALL_MATCHES.length} partidos creados\n`)

    console.log('✅ Seed de torneo completado con éxito!')
  } catch (err) {
    console.error('\n❌ Error durante el seed:', err)
    process.exit(1)
  }
}

main()
