/**
 * Seed Script — Datos de prueba básicos (sin Admin SDK)
 *
 * Uso: pnpm seed
 *
 * Crea: equipos, grupos, partidos
 * (Usuarios y boards deben crearse desde la app o Firebase Console)
 */
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { readFileSync } from 'fs'

// Cargar .env
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

// Inicializar Firebase
const app = getApps().length ? getApps()[0]! : initializeApp(config)
const db = getFirestore(app)

const TOURNAMENT_ID = 'mundial2026'

const teams = [
  { name: 'Argentina', shortName: 'ARG', country: 'AR', logoUrl: '' },
  { name: 'Brasil', shortName: 'BRA', country: 'BR', logoUrl: '' },
  { name: 'México', shortName: 'MEX', country: 'MX', logoUrl: '' },
  { name: 'Estados Unidos', shortName: 'USA', country: 'US', logoUrl: '' },
  { name: 'Canadá', shortName: 'CAN', country: 'CA', logoUrl: '' },
  { name: 'España', shortName: 'ESP', country: 'ES', logoUrl: '' },
  { name: 'Francia', shortName: 'FRA', country: 'FR', logoUrl: '' },
  { name: 'Alemania', shortName: 'GER', country: 'DE', logoUrl: '' },
  { name: 'Inglaterra', shortName: 'ENG', country: 'GB', logoUrl: '' },
  { name: 'Portugal', shortName: 'POR', country: 'PT', logoUrl: '' },
  { name: 'Países Bajos', shortName: 'NED', country: 'NL', logoUrl: '' },
  { name: 'Italia', shortName: 'ITA', country: 'IT', logoUrl: '' },
  { name: 'Japón', shortName: 'JPN', country: 'JP', logoUrl: '' },
  { name: 'Corea del Sur', shortName: 'KOR', country: 'KR', logoUrl: '' },
  { name: 'Australia', shortName: 'AUS', country: 'AU', logoUrl: '' },
  { name: 'Arabia Saudita', shortName: 'KSA', country: 'SA', logoUrl: '' }
]

const groups = [
  { name: 'Amigos del Fútbol', code: 'AMIGOS' },
  { name: 'Familia 2026', code: 'FAM26' },
  { name: 'Oficina', code: 'TRABAJO' }
]

const matches = [
  { localIdx: 0, visitorIdx: 1, date: '2026-06-11T17:00:00Z', phase: 'Fase de Grupos', matchNumber: 1 },
  { localIdx: 2, visitorIdx: 3, date: '2026-06-11T20:00:00Z', phase: 'Fase de Grupos', matchNumber: 2 },
  { localIdx: 4, visitorIdx: 5, date: '2026-06-12T14:00:00Z', phase: 'Fase de Grupos', matchNumber: 3 },
  { localIdx: 6, visitorIdx: 7, date: '2026-06-12T17:00:00Z', phase: 'Fase de Grupos', matchNumber: 4 },
  { localIdx: 8, visitorIdx: 9, date: '2026-06-12T20:00:00Z', phase: 'Fase de Grupos', matchNumber: 5 },
  { localIdx: 10, visitorIdx: 11, date: '2026-06-13T14:00:00Z', phase: 'Fase de Grupos', matchNumber: 6 },
  { localIdx: 0, visitorIdx: 2, date: '2026-06-15T17:00:00Z', phase: 'Fase de Grupos', matchNumber: 7 },
  { localIdx: 1, visitorIdx: 3, date: '2026-06-15T20:00:00Z', phase: 'Fase de Grupos', matchNumber: 8 },
  { localIdx: 4, visitorIdx: 6, date: '2026-06-16T17:00:00Z', phase: 'Fase de Grupos', matchNumber: 9 },
  { localIdx: 5, visitorIdx: 7, date: '2026-06-16T20:00:00Z', phase: 'Fase de Grupos', matchNumber: 10 },
  { localIdx: 0, visitorIdx: 2, date: '2026-06-28T16:00:00Z', phase: 'Octavos de Final', matchNumber: 49 },
  { localIdx: 1, visitorIdx: 3, date: '2026-06-28T20:00:00Z', phase: 'Octavos de Final', matchNumber: 50 },
  { localIdx: 0, visitorIdx: 1, date: '2026-07-04T16:00:00Z', phase: 'Cuartos de Final', matchNumber: 57 },
  { localIdx: 0, visitorIdx: 1, date: '2026-07-09T20:00:00Z', phase: 'Semifinales', matchNumber: 61 },
  { localIdx: 0, visitorIdx: 1, date: '2026-07-19T20:00:00Z', phase: 'Final', matchNumber: 64 }
]

async function main() {
  console.log('🚀 Seed de datos de prueba\n')
  console.log(`   Proyecto: ${config.projectId}`)

  try {
    // Equipos
    console.log('\n📦 Creando equipos...')
    const teamRefs: string[] = []
    for (const team of teams) {
      const docRef = await addDoc(collection(db, 'teams'), {
        ...team,
        createdAt: serverTimestamp()
      })
      teamRefs.push(docRef.id)
      console.log(`   ✓ ${team.shortName}`)
    }

    // Grupos
    console.log('\n📦 Creando grupos...')
    const groupRefs: { id: string, code: string }[] = []
    for (const group of groups) {
      const docRef = await addDoc(collection(db, 'groups'), {
        ...group,
        ownerId: 'seed-admin',
        ownerName: 'Seed Admin',
        tournamentId: TOURNAMENT_ID,
        isActive: true,
        createdAt: serverTimestamp()
      })
      groupRefs.push({ id: docRef.id, code: group.code })
      console.log(`   ✓ ${group.name} (${group.code})`)
    }

    // Partidos
    console.log('\n📦 Creando partidos...')
    for (const m of matches) {
      const localTeam = teams[m.localIdx]
      const visitorTeam = teams[m.visitorIdx]
      await addDoc(collection(db, 'matches'), {
        tournamentId: TOURNAMENT_ID,
        localTeamId: teamRefs[m.localIdx],
        visitorTeamId: teamRefs[m.visitorIdx],
        localTeamName: localTeam.name,
        visitorTeamName: visitorTeam.name,
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
      console.log(`   ✓ ${localTeam.shortName} vs ${visitorTeam.shortName}`)
    }

    console.log('\n✅ Seed completado!')
    console.log('\n📋 Siguiente paso:')
    console.log('   1. Crea un usuario desde la app (signup)')
    console.log('   2. Busca un grupo por código (AMIGOS, FAM26, TRABAJO)')
    console.log('   3. Solicita una tabla')
    console.log('   4. Apruébalas desde /admin/groups')
    console.log('')
  } catch (err) {
    console.error('\n❌ Error:', err)
    process.exit(1)
  }
}

main()
