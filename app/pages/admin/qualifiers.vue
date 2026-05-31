<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { teamRepository } from '~/repositories/team.repository'
import { qualifierService } from '~/services/qualifier.service'
import type { Team, QualifierPhase, QualifierConfig } from '~/types'
import { TEAM_GROUPS } from '~/constants/teams'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const appStore = useAppStore()
const toast = useToast()

const activeTab = ref<QualifierPhase>('dieciseisavos')
const teams = ref<Team[]>([])
const loading = ref(true)
const saving = ref(false)

const deadlines = reactive<Record<QualifierPhase, string>>({
  dieciseisavos: '',
  octavos: '',
  cuartos: '',
  semifinales: '',
  final: '',
  tercer_lugar: '',
  campeon: ''
})

const actualQualifiers = reactive<Record<QualifierPhase, string[]>>({
  dieciseisavos: [],
  octavos: [],
  cuartos: [],
  semifinales: [],
  final: [],
  tercer_lugar: [],
  campeon: []
})

const teamSearch = ref('')

const tabs: Array<{ value: QualifierPhase, label: string, limit: number }> = [
  { value: 'dieciseisavos', label: '16vos (32)', limit: 32 },
  { value: 'octavos', label: '8vos (16)', limit: 16 },
  { value: 'cuartos', label: '4tos (8)', limit: 8 },
  { value: 'semifinales', label: 'Semis (4)', limit: 4 },
  { value: 'final', label: 'Final (2)', limit: 2 },
  { value: 'tercer_lugar', label: '3er Lugar (1)', limit: 1 },
  { value: 'campeon', label: 'Campeón (1)', limit: 1 }
]

onMounted(async () => {
  appStore.setPageTitle('Admin Clasificados')
  try {
    const [teamsData, configData] = await Promise.all([
      teamRepository.findAll(),
      qualifierService.getConfig()
    ])

    teams.value = teamsData.filter(t => t.shortName !== 'TBD')

    // Mapear deadlines a formato input datetime-local (YYYY-MM-DDTHH:mm)
    const phases: QualifierPhase[] = ['dieciseisavos', 'octavos', 'cuartos', 'semifinales', 'final', 'tercer_lugar', 'campeon']
    for (const phase of phases) {
      const dl = configData.deadlines[phase]
      deadlines[phase] = dl ? dayjs(dl).format('YYYY-MM-DDTHH:mm') : ''
      actualQualifiers[phase] = [...(configData.actualQualifiers[phase] ?? [])]
    }
  } catch (err) {
    console.error('Error cargando configuración:', err)
  } finally {
    loading.value = false
  }
})

// Equipos organizados por grupo para 16vos
const groupTeams = computed(() => {
  const groups: Record<string, Team[]> = {}
  for (const team of teams.value) {
    const grp = TEAM_GROUPS[team.name] || 'Otros'
    if (!groups[grp]) groups[grp] = []
    groups[grp].push(team)
  }
  return groups
})

// Filtrar equipos para las fases eliminatorias (buscador simple)
const filteredTeams = computed(() => {
  const q = teamSearch.value.toLowerCase().trim()
  if (!q) return teams.value
  return teams.value.filter(t =>
    t.name.toLowerCase().includes(q)
    || t.shortName.toLowerCase().includes(q)
  )
})

const currentLimit = computed(() => {
  return tabs.find(t => t.value === activeTab.value)?.limit ?? 0
})

const currentSelectionCount = computed(() => {
  return actualQualifiers[activeTab.value]?.length ?? 0
})

// Toggle selección de clasificados oficiales
function toggleActualQualifier(teamId: string) {
  const phase = activeTab.value
  const list = [...actualQualifiers[phase]]
  const idx = list.indexOf(teamId)

  if (idx > -1) {
    list.splice(idx, 1)
    actualQualifiers[phase] = list
  } else {
    // Validar límite total
    if (list.length >= currentLimit.value) {
      toast.add({
        title: 'Límite de clasificados',
        description: `Esta fase admite un máximo de ${currentLimit.value} equipos.`,
        color: 'warning'
      })
      return
    }

    // Validar límite de grupo en dieciseisavos (max 3 por grupo)
    if (phase === 'dieciseisavos') {
      const team = teams.value.find(t => t.id === teamId)
      if (team) {
        const teamGroup = TEAM_GROUPS[team.name]
        if (teamGroup) {
          const currentInGroup = list.filter((id) => {
            const t = teams.value.find(x => x.id === id)
            return t && TEAM_GROUPS[t.name] === teamGroup
          }).length

          if (currentInGroup >= 3) {
            toast.add({
              title: 'Límite de grupo',
              description: `Solo puedes elegir un máximo de 3 equipos del Grupo ${teamGroup}.`,
              color: 'warning'
            })
            return
          }
        }
      }
    }

    list.push(teamId)
    actualQualifiers[phase] = list
  }
}

async function handleSave() {
  saving.value = true
  try {
    // Convertir deadlines de local a ISO string
    const finalDeadlines: Record<QualifierPhase, string> = { ...deadlines }
    const phases: QualifierPhase[] = ['dieciseisavos', 'octavos', 'cuartos', 'semifinales', 'final', 'tercer_lugar', 'campeon']
    for (const phase of phases) {
      const val = deadlines[phase]
      finalDeadlines[phase] = val ? new Date(val).toISOString() : ''
    }

    const newConfig: QualifierConfig = {
      deadlines: finalDeadlines,
      actualQualifiers: { ...actualQualifiers }
    }

    await qualifierService.saveConfig(newConfig)

    toast.add({
      title: 'Configuración guardada',
      description: 'Clasificados oficiales guardados y rankings actualizados con éxito.',
      color: 'success'
    })
  } catch (err: unknown) {
    const error = err as Error
    toast.add({
      title: 'Error al guardar',
      description: error.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-32">
    <div class="px-4 sm:px-6">
      <LayoutPageHeader
        title="Clasificados de Fases"
        subtitle="Define tiempos límite y equipos clasificados oficialmente"
      />
    </div>

    <div
      v-if="loading"
      class="px-4 sm:px-6 space-y-4"
    >
      <USkeleton class="h-12 rounded-xl" />
      <USkeleton class="h-48 rounded-xl" />
    </div>

    <div
      v-else
      class="relative z-10 -mt-16 px-4 sm:px-6 flex flex-col gap-6"
    >
      <!-- Selector de Fases -->
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-(--ui-border) stagger-up">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all shrink-0 active:scale-95 cursor-pointer"
          :class="[
            activeTab === t.value
              ? 'border-primary-500 bg-primary-500 text-white shadow-md'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text-muted) hover:border-(--ui-border-muted)'
          ]"
          @click="activeTab = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Configuración del Límite de Tiempo -->
      <div class="card-elevated border border-(--ui-border) p-5 stagger-up stagger-d1 flex flex-col gap-4">
        <h3 class="font-heading font-black text-sm text-neutral-800 dark:text-white uppercase tracking-wider">
          Configuración de Tiempo Límite
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div class="space-y-1">
            <span class="text-xs text-neutral-500 font-bold uppercase tracking-wider">
              Límite de Pronósticos (Fase Activa)
            </span>
            <p class="text-xs text-neutral-400">
              Los usuarios no podrán crear ni modificar pronósticos para esta fase después de este tiempo.
            </p>
          </div>
          <div>
            <input
              v-model="deadlines[activeTab]"
              type="datetime-local"
              class="w-full bg-(--ui-bg-elevated) border border-(--ui-border) rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-neutral-800 dark:text-white font-mono"
            >
          </div>
        </div>
      </div>

      <!-- Selección de Clasificados Oficiales -->
      <div class="card-elevated border border-(--ui-border) p-5 stagger-up stagger-d2 flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <h3 class="font-heading font-black text-sm text-neutral-800 dark:text-white uppercase tracking-wider">
            Equipos Clasificados Oficiales
          </h3>
          <span class="text-xs font-black uppercase tracking-wider text-neutral-500">
            Definidos: {{ currentSelectionCount }} / {{ currentLimit }}
          </span>
        </div>

        <!-- Buscador para fases eliminatorias -->
        <div
          v-if="activeTab !== 'dieciseisavos'"
          class="relative w-full max-w-sm mb-2"
        >
          <input
            v-model="teamSearch"
            type="text"
            placeholder="Buscar equipo..."
            class="w-full bg-(--ui-bg-elevated) border border-(--ui-border) rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-neutral-800 dark:text-white"
          >
          <div class="absolute left-3 top-2.5 text-neutral-400">
            <UIcon
              name="i-lucide-search"
              class="size-4"
            />
          </div>
        </div>

        <!-- Grilla de Selección por Grupos (16vos) -->
        <div
          v-if="activeTab === 'dieciseisavos'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="(grpTeams, grpName) in groupTeams"
            :key="grpName"
            class="border border-(--ui-border) rounded-xl p-3 bg-neutral-50/10 dark:bg-neutral-800/5 space-y-2.5"
          >
            <div class="text-[10px] font-black uppercase tracking-wider text-primary-500 dark:text-primary-400 border-b border-neutral-100 dark:border-neutral-850 pb-1.5 flex justify-between">
              <span>Grupo {{ grpName }}</span>
              <span>Definidos: {{ grpTeams.filter(t => actualQualifiers.dieciseisavos.includes(t.id)).length }}</span>
            </div>
            <div class="flex flex-col gap-1.5">
              <button
                v-for="team in grpTeams"
                :key="team.id"
                type="button"
                class="flex items-center justify-between p-2 rounded-lg border transition-all text-left cursor-pointer"
                :class="[
                  actualQualifiers.dieciseisavos.includes(team.id)
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm'
                    : 'border-transparent bg-transparent text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
                ]"
                @click="toggleActualQualifier(team.id)"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <MatchTeamLogo
                    :logo-url="team.logoUrl"
                    :name="team.name"
                    size="sm"
                  />
                  <span class="text-xs uppercase font-medium truncate">{{ team.name }}</span>
                </div>
                <UIcon
                  v-if="actualQualifiers.dieciseisavos.includes(team.id)"
                  name="i-lucide-check-circle-2"
                  class="size-4 text-emerald-500"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Grilla de Selección de Todos los Equipos (Fases Eliminatorias) -->
        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          <button
            v-for="team in filteredTeams"
            :key="team.id"
            type="button"
            class="flex flex-col items-center justify-center p-3 rounded-xl border text-center gap-2 transition-all cursor-pointer"
            :class="[
              actualQualifiers[activeTab].includes(team.id)
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm'
                : 'border-(--ui-border) bg-(--ui-bg-elevated) text-neutral-800 dark:text-neutral-200 hover:border-neutral-400'
            ]"
            @click="toggleActualQualifier(team.id)"
          >
            <MatchTeamLogo
              :logo-url="team.logoUrl"
              :name="team.name"
              size="md"
            />
            <span class="text-xs uppercase font-bold truncate max-w-full">
              {{ team.name }}
            </span>
          </button>
        </div>
      </div>

      <!-- Botón de Guardar Todo -->
      <div class="flex justify-end stagger-up stagger-d3">
        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-save"
          class="px-8 cursor-pointer"
          :loading="saving"
          @click="handleSave"
        >
          Guardar Configuración
        </UButton>
      </div>
    </div>
  </div>
</template>
