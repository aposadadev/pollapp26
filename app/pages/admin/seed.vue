<script setup lang="ts">
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
const toast = useToast()

const TOURNAMENT_ID = appStore.activeTournamentId

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
    const message = err instanceof Error ? err.message : String(err)
    log(`❌ Error: ${message}`)
    toast.add({ title: '❌ Error en seed', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => appStore.setPageTitle('Seed — Admin'))
</script>

<template>
  <div class="space-y-6 pb-20">
    <LayoutPageHeader
      title="Seed de Datos"
      subtitle="Puebla la base de datos con información de prueba para desarrollo."
    />

    <div class="px-4 space-y-6">
      <div class="card-elevated p-6 stagger-up">
        <div class="flex items-center gap-3 mb-4">
          <div class="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
            <UIcon
              name="i-lucide-database"
              class="size-6"
            />
          </div>
          <h2 class="font-heading text-lg font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
            Poblar Firestore
          </h2>
        </div>

        <p class="text-sm text-(--ui-text-muted) mb-6 leading-relaxed">
          Este proceso creará equipos internacionales, grupos de ejemplo y un calendario inicial de partidos en tu base de datos de Firebase.
          <span class="block mt-2 font-bold text-error-500">Nota: Los datos se duplicarán si ejecutas esto varias veces.</span>
        </p>

        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-play"
          class="w-full font-bold shadow-lg shadow-primary-500/20 rounded-2xl"
          :loading="loading"
          @click="seed"
        >
          Ejecutar Proceso de Seed
        </UButton>

        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
        >
          <div
            v-if="status.length"
            class="mt-6 p-4 bg-(--ui-bg-muted) rounded-2xl font-mono text-[11px] space-y-1.5 max-h-64 overflow-y-auto border border-(--ui-border) shadow-inner"
          >
            <div
              v-for="(line, i) in status"
              :key="i"
              class="flex items-start gap-2"
            >
              <span class="text-primary-500 shrink-0">>></span>
              <span class="text-(--ui-text-highlighted)">{{ line }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <div class="card-elevated p-6 stagger-up stagger-d1">
        <div class="flex items-center gap-3 mb-4">
          <div class="size-10 rounded-xl bg-secondary-500/10 flex items-center justify-center text-secondary-500">
            <UIcon
              name="i-lucide-info"
              class="size-6"
            />
          </div>
          <h2 class="font-heading text-lg font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
            Instrucciones
          </h2>
        </div>

        <ul class="space-y-3">
          <li class="flex gap-3 text-sm text-(--ui-text-muted)">
            <UIcon
              name="i-lucide-circle-check"
              class="size-5 text-secondary-500 shrink-0"
            />
            <span>Los equipos se generan con IDs únicos de Firestore.</span>
          </li>
          <li class="flex gap-3 text-sm text-(--ui-text-muted)">
            <UIcon
              name="i-lucide-circle-check"
              class="size-5 text-secondary-500 shrink-0"
            />
            <span>Los partidos se vinculan automáticamente a los equipos creados.</span>
          </li>
          <li class="flex gap-3 text-sm text-(--ui-text-muted)">
            <UIcon
              name="i-lucide-circle-check"
              class="size-5 text-secondary-500 shrink-0"
            />
            <span>No se crean usuarios. Debes registrarte normalmente en la app.</span>
          </li>
          <li class="flex gap-3 text-sm text-(--ui-text-muted)">
            <UIcon
              name="i-lucide-triangle-alert"
              class="size-5 text-error-500 shrink-0"
            />
            <span>Para limpiar la base de datos, ve a la consola de Firebase y elimina las colecciones.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
