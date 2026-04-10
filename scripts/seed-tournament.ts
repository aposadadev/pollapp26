/**
 * seed-tournament.ts — Data oficial del torneo
 *
 * Crea equipos y partidos del Mundial 2026 (placeholder).
 * Cuando tengas la data real, reemplaza las constantes al final del archivo.
 *
 * Uso: pnpm seed:tournament
 *
 * ⚠️  Idempotente: si ya existen documentos con el mismo contenido,
 *     se crearán duplicados. Limpia la colección antes si es necesario.
 */
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
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

const config = {
  apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID
}

if (!config.apiKey || !config.projectId) {
  console.error('❌ ERROR: Faltan credenciales de Firebase en .env')
  process.exit(1)
}

const app = getApps().length ? getApps()[0]! : initializeApp(config)
const db = getFirestore(app)

// ── Constantes ────────────────────────────────────────────────────────────────
const TOURNAMENT_ID = 'mundial2026'

// ── EQUIPOS ──────────────────────────────────────────────────────────────────
// TODO: Reemplazar con los 48 equipos clasificados al Mundial 2026
// Fuente: https://www.fifa.com/fifaplus/es/tournaments/mens/worldcup/canadamexicousa2026
const TEAMS: Array<{ name: string, shortName: string, country: string, logoUrl: string }> = [
  // Conmebol
  { name: 'Argentina', shortName: 'ARG', country: 'AR', logoUrl: '' },
  { name: 'Brasil', shortName: 'BRA', country: 'BR', logoUrl: '' },
  { name: 'Uruguay', shortName: 'URU', country: 'UY', logoUrl: '' },
  { name: 'Colombia', shortName: 'COL', country: 'CO', logoUrl: '' },
  { name: 'Ecuador', shortName: 'ECU', country: 'EC', logoUrl: '' },
  { name: 'Paraguay', shortName: 'PAR', country: 'PY', logoUrl: '' },
  // UEFA
  { name: 'España', shortName: 'ESP', country: 'ES', logoUrl: '' },
  { name: 'Francia', shortName: 'FRA', country: 'FR', logoUrl: '' },
  { name: 'Alemania', shortName: 'GER', country: 'DE', logoUrl: '' },
  { name: 'Inglaterra', shortName: 'ENG', country: 'GB', logoUrl: '' },
  { name: 'Portugal', shortName: 'POR', country: 'PT', logoUrl: '' },
  { name: 'Países Bajos', shortName: 'NED', country: 'NL', logoUrl: '' },
  { name: 'Italia', shortName: 'ITA', country: 'IT', logoUrl: '' },
  { name: 'Bélgica', shortName: 'BEL', country: 'BE', logoUrl: '' },
  { name: 'Croacia', shortName: 'CRO', country: 'HR', logoUrl: '' },
  { name: 'Suiza', shortName: 'SUI', country: 'CH', logoUrl: '' },
  { name: 'Dinamarca', shortName: 'DEN', country: 'DK', logoUrl: '' },
  { name: 'Austria', shortName: 'AUT', country: 'AT', logoUrl: '' },
  { name: 'Serbia', shortName: 'SRB', country: 'RS', logoUrl: '' },
  { name: 'Ucrania', shortName: 'UKR', country: 'UA', logoUrl: '' },
  { name: 'Turquía', shortName: 'TUR', country: 'TR', logoUrl: '' },
  { name: 'Polonia', shortName: 'POL', country: 'PL', logoUrl: '' },
  { name: 'Escocia', shortName: 'SCO', country: 'GB-SCT', logoUrl: '' },
  { name: 'Hungría', shortName: 'HUN', country: 'HU', logoUrl: '' },
  { name: 'Eslovenia', shortName: 'SVN', country: 'SI', logoUrl: '' },
  { name: 'Eslovaquia', shortName: 'SVK', country: 'SK', logoUrl: '' },
  { name: 'Rumania', shortName: 'ROU', country: 'RO', logoUrl: '' },
  { name: 'Albania', shortName: 'ALB', country: 'AL', logoUrl: '' },
  { name: 'República Checa', shortName: 'CZE', country: 'CZ', logoUrl: '' },
  { name: 'Georgia', shortName: 'GEO', country: 'GE', logoUrl: '' },
  // Concacaf (anfitriones directos + clasificados)
  { name: 'México', shortName: 'MEX', country: 'MX', logoUrl: '' },
  { name: 'Estados Unidos', shortName: 'USA', country: 'US', logoUrl: '' },
  { name: 'Canadá', shortName: 'CAN', country: 'CA', logoUrl: '' },
  { name: 'Costa Rica', shortName: 'CRC', country: 'CR', logoUrl: '' },
  { name: 'Honduras', shortName: 'HON', country: 'HN', logoUrl: '' },
  { name: 'Jamaica', shortName: 'JAM', country: 'JM', logoUrl: '' },
  // AFC
  { name: 'Japón', shortName: 'JPN', country: 'JP', logoUrl: '' },
  { name: 'Corea del Sur', shortName: 'KOR', country: 'KR', logoUrl: '' },
  { name: 'Arabia Saudita', shortName: 'KSA', country: 'SA', logoUrl: '' },
  { name: 'Australia', shortName: 'AUS', country: 'AU', logoUrl: '' },
  { name: 'Irán', shortName: 'IRN', country: 'IR', logoUrl: '' },
  { name: 'Iraq', shortName: 'IRQ', country: 'IQ', logoUrl: '' },
  // CAF
  { name: 'Marruecos', shortName: 'MAR', country: 'MA', logoUrl: '' },
  { name: 'Senegal', shortName: 'SEN', country: 'SN', logoUrl: '' },
  { name: 'Egipto', shortName: 'EGY', country: 'EG', logoUrl: '' },
  { name: 'Nigeria', shortName: 'NGA', country: 'NG', logoUrl: '' },
  // OFC
  { name: 'Nueva Zelanda', shortName: 'NZL', country: 'NZ', logoUrl: '' },
  // Repechaje / placeholder
  { name: 'TBD', shortName: 'TBD', country: '', logoUrl: '' }
]

// ── PARTIDOS — FASE DE GRUPOS (placeholder) ───────────────────────────────────
// TODO: Reemplazar con el fixture oficial cuando se publique (diciembre 2025 aprox.)
// Los índices apuntan a TEAMS[]. Se usan los primeros partidos como ejemplo.
type MatchDef = {
  localIdx: number
  visitorIdx: number
  date: string
  phase: 'Fase de Grupos' | 'Octavos de Final' | 'Cuartos de Final' | 'Semifinales' | 'Tercer Lugar' | 'Final'
  matchNumber: number
}

const MATCHES: MatchDef[] = [
  // Fase de Grupos — Jornada 1
  { localIdx: 31, visitorIdx: 26, date: '2026-06-11T17:00:00Z', phase: 'Fase de Grupos', matchNumber: 1 }, // USA vs Rumanía (ejemplo)
  { localIdx: 30, visitorIdx: 36, date: '2026-06-11T20:00:00Z', phase: 'Fase de Grupos', matchNumber: 2 }, // MEX vs Japón
  { localIdx: 32, visitorIdx: 3, date: '2026-06-12T14:00:00Z', phase: 'Fase de Grupos', matchNumber: 3 }, // CAN vs Colombia
  { localIdx: 0, visitorIdx: 1, date: '2026-06-12T17:00:00Z', phase: 'Fase de Grupos', matchNumber: 4 }, // ARG vs BRA
  { localIdx: 6, visitorIdx: 7, date: '2026-06-12T20:00:00Z', phase: 'Fase de Grupos', matchNumber: 5 }, // ESP vs FRA
  { localIdx: 8, visitorIdx: 9, date: '2026-06-13T14:00:00Z', phase: 'Fase de Grupos', matchNumber: 6 }, // GER vs ENG
  { localIdx: 10, visitorIdx: 11, date: '2026-06-13T17:00:00Z', phase: 'Fase de Grupos', matchNumber: 7 }, // POR vs NED
  { localIdx: 42, visitorIdx: 4, date: '2026-06-13T20:00:00Z', phase: 'Fase de Grupos', matchNumber: 8 }, // MAR vs ECU
  { localIdx: 43, visitorIdx: 2, date: '2026-06-14T14:00:00Z', phase: 'Fase de Grupos', matchNumber: 9 }, // SEN vs URU
  { localIdx: 12, visitorIdx: 37, date: '2026-06-14T17:00:00Z', phase: 'Fase de Grupos', matchNumber: 10 }, // ITA vs KOR
  // Octavos de Final (placeholder — equipos TBD)
  { localIdx: 47, visitorIdx: 47, date: '2026-06-28T16:00:00Z', phase: 'Octavos de Final', matchNumber: 49 },
  { localIdx: 47, visitorIdx: 47, date: '2026-06-28T20:00:00Z', phase: 'Octavos de Final', matchNumber: 50 },
  { localIdx: 47, visitorIdx: 47, date: '2026-06-29T16:00:00Z', phase: 'Octavos de Final', matchNumber: 51 },
  { localIdx: 47, visitorIdx: 47, date: '2026-06-29T20:00:00Z', phase: 'Octavos de Final', matchNumber: 52 },
  { localIdx: 47, visitorIdx: 47, date: '2026-06-30T16:00:00Z', phase: 'Octavos de Final', matchNumber: 53 },
  { localIdx: 47, visitorIdx: 47, date: '2026-06-30T20:00:00Z', phase: 'Octavos de Final', matchNumber: 54 },
  { localIdx: 47, visitorIdx: 47, date: '2026-07-01T16:00:00Z', phase: 'Octavos de Final', matchNumber: 55 },
  { localIdx: 47, visitorIdx: 47, date: '2026-07-01T20:00:00Z', phase: 'Octavos de Final', matchNumber: 56 },
  // Cuartos de Final
  { localIdx: 47, visitorIdx: 47, date: '2026-07-04T16:00:00Z', phase: 'Cuartos de Final', matchNumber: 57 },
  { localIdx: 47, visitorIdx: 47, date: '2026-07-04T20:00:00Z', phase: 'Cuartos de Final', matchNumber: 58 },
  { localIdx: 47, visitorIdx: 47, date: '2026-07-05T16:00:00Z', phase: 'Cuartos de Final', matchNumber: 59 },
  { localIdx: 47, visitorIdx: 47, date: '2026-07-05T20:00:00Z', phase: 'Cuartos de Final', matchNumber: 60 },
  // Semifinales
  { localIdx: 47, visitorIdx: 47, date: '2026-07-09T20:00:00Z', phase: 'Semifinales', matchNumber: 61 },
  { localIdx: 47, visitorIdx: 47, date: '2026-07-10T20:00:00Z', phase: 'Semifinales', matchNumber: 62 },
  // Tercer Lugar
  { localIdx: 47, visitorIdx: 47, date: '2026-07-15T16:00:00Z', phase: 'Tercer Lugar', matchNumber: 63 },
  // Final
  { localIdx: 47, visitorIdx: 47, date: '2026-07-19T20:00:00Z', phase: 'Final', matchNumber: 64 }
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Seed del torneo — Equipos y Partidos\n')
  console.log(`   Proyecto:    ${config.projectId}`)
  console.log(`   Torneo:      ${TOURNAMENT_ID}\n`)

  try {
    // Equipos
    console.log('📦 Creando equipos...')
    const teamIds: string[] = []
    for (const team of TEAMS) {
      const ref = await addDoc(collection(db, 'teams'), {
        ...team,
        tournamentId: TOURNAMENT_ID,
        createdAt: serverTimestamp()
      })
      teamIds.push(ref.id)
      if (team.shortName !== 'TBD') {
        console.log(`   ✓ ${team.shortName.padEnd(4)} — ${team.name}`)
      }
    }
    console.log(`   → ${teamIds.length} equipos creados\n`)

    // Partidos
    console.log('📦 Creando partidos...')
    for (const m of MATCHES) {
      const local = TEAMS[m.localIdx]
      const visitor = TEAMS[m.visitorIdx]
      await addDoc(collection(db, 'matches'), {
        tournamentId: TOURNAMENT_ID,
        localTeamId: teamIds[m.localIdx],
        visitorTeamId: teamIds[m.visitorIdx],
        localTeamName: local.name,
        visitorTeamName: visitor.name,
        localTeamLogo: local.logoUrl,
        visitorTeamLogo: visitor.logoUrl,
        localGoals: null,
        visitorGoals: null,
        date: new Date(m.date),
        phase: m.phase,
        matchNumber: m.matchNumber,
        status: 'scheduled',
        isActive: false,
        isClosed: false,
        createdAt: serverTimestamp()
      })
      const label = local.shortName === 'TBD' ? `TBD vs TBD` : `${local.shortName} vs ${visitor.shortName}`
      console.log(`   ✓ #${String(m.matchNumber).padStart(2, '0')} ${m.phase.padEnd(20)} ${label}`)
    }
    console.log(`   → ${MATCHES.length} partidos creados\n`)

    console.log('✅ Seed de torneo completado!')
    console.log('\n📋 Siguiente paso:')
    console.log('   Cuando tengas el fixture oficial, actualiza TEAMS y MATCHES en este archivo.')
    console.log('   Limpia las colecciones teams/matches en Firestore antes de volver a correr.\n')
  } catch (err) {
    console.error('\n❌ Error:', err)
    process.exit(1)
  }
}

main()
