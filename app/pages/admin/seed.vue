<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
const toast = useToast()

const loading = ref(false)
const status = ref<string[]>([])

function log(msg: string) {
  status.value.push(msg)
}

function getDb(): Firestore {
  return useNuxtApp().$firestore as Firestore
}

async function seed() {
  loading.value = true
  status.value = []
  const db = getDb()

  try {
    // 1. Equipos
    log('📦 Creando equipos...')
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

    const teamRefs: string[] = []
    for (const team of teams) {
      const docRef = await addDoc(collection(db, 'teams'), {
        ...team,
        createdAt: serverTimestamp()
      })
      teamRefs.push(docRef.id)
    }
    log(`   ✓ ${teams.length} equipos creados`)

    // 2. Grupos
    log('📦 Creando grupos...')
    const groups = [
      { name: 'Amigos del Fútbol', code: 'AMIGOS' },
      { name: 'Familia 2026', code: 'FAM26' },
      { name: 'Oficina', code: 'TRABAJO' }
    ]

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
    }
    log(`   ✓ ${groups.length} grupos creados`)

    // 3. Partidos
    log('📦 Creando partidos...')
    const matchData = [
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

    for (const m of matchData) {
      const localTeam = teams[m.localIdx]!
      const visitorTeam = teams[m.visitorIdx]!
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
    }
    log(`   ✓ ${matchData.length} partidos creados`)

    toast.add({ title: '✅ Seed completado', description: 'Datos de prueba creados exitosamente', color: 'secondary' })
  } catch (err: unknown) {
    console.error('Seed error:', err)
    const message = err instanceof Error ? err.message : String(err)
    log(`❌ Error: ${message}`)
    toast.add({ title: '❌ Error en seed', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const TOURNAMENT_ID = mundial2026.id

onMounted(() => appStore.setPageTitle('Seed — Admin'))
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-lg font-bold text-(--ui-text-highlighted)">
        Seed de Datos
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        Crea datos de prueba para desarrollo.
      </p>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-database"
            class="size-4"
          />
          <span class="font-semibold">Poblar base de datos</span>
        </div>
      </template>

      <p class="text-sm text-(--ui-text-muted) mb-4">
        Este botón creará equipos, grupos y partidos de prueba en Firestore.
        Puedes ejecutarlo varias veces — los datos se duplicarán si no los borras primero.
      </p>

      <UButton
        color="primary"
        icon="i-lucide-play"
        :loading="loading"
        @click="seed"
      >
        Ejecutar Seed
      </UButton>

      <div
        v-if="status.length"
        class="mt-4 p-3 bg-(--ui-bg-elevated) rounded-lg font-mono text-xs space-y-1 max-h-60 overflow-auto"
      >
        <div
          v-for="(line, i) in status"
          :key="i"
        >
          {{ line }}
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-info"
            class="size-4"
          />
          <span class="font-semibold">Notas</span>
        </div>
      </template>
      <ul class="text-xs text-(--ui-text-muted) space-y-2">
        <li>• Los equipos se crean con IDs aleatorios</li>
        <li>• Los partidos referencian esos equipos</li>
        <li>• No se crean usuarios ni boards — haz eso manualmente o usa Firebase Console</li>
        <li>• Para borrar todo: Firebase Console → Firestore → "Eliminar colección"</li>
      </ul>
    </UCard>
  </div>
</template>
