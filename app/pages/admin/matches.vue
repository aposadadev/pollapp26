<script setup lang="ts">
import type { Match, Team } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
const { loading, activateMatch, closeMatch, updateMatchTeams, getTeams } = useAdmin()
const { matches, loadAll } = useMatches(appStore.activeTournamentId)

const teams = ref<Team[]>([])
const closingMatchId = ref<string | null>(null)
const editingTeamsMatchId = ref<string | null>(null)

// Writable computed booleans for UModal v-model:open
const showCloseModal = computed({
  get: () => closingMatchId.value !== null,
  set: (val) => { if (!val) closingMatchId.value = null }
})
const showTeamsModal = computed({
  get: () => editingTeamsMatchId.value !== null,
  set: (val) => { if (!val) editingTeamsMatchId.value = null }
})
const tab = ref<'active' | 'scheduled' | 'closed'>('active')

// Close match form
const closeForm = reactive({ localGoals: 0, visitorGoals: 0 })

// Edit teams form
const teamsForm = reactive({ localTeamId: '', visitorTeamId: '' })

const activeMatches = computed(() => matches.value.filter(m => m.isActive && !m.isClosed))
const scheduledMatches = computed(() => matches.value.filter(m => !m.isActive && !m.isClosed))
const closedMatches = computed(() => matches.value.filter(m => m.isClosed))

const tabItems = computed(() => [
  { label: `Activos (${activeMatches.value.length})`, value: 'active', icon: 'i-lucide-zap' },
  { label: `Programados (${scheduledMatches.value.length})`, value: 'scheduled', icon: 'i-lucide-clock' },
  { label: `Cerrados (${closedMatches.value.length})`, value: 'closed', icon: 'i-lucide-circle-check' }
])

const currentList = computed<Match[]>(() => {
  if (tab.value === 'active') return activeMatches.value
  if (tab.value === 'scheduled') return scheduledMatches.value
  return closedMatches.value
})

const teamOptions = computed(() =>
  teams.value.map(t => ({ label: `${t.shortName} — ${t.name}`, value: t.id }))
)

function teamName(teamId: string) {
  return teams.value.find(t => t.id === teamId)?.shortName ?? teamId
}

onMounted(async () => {
  appStore.setPageTitle('Partidos — Admin')
  const [_m, t] = await Promise.all([loadAll(), getTeams()])
  teams.value = t
})

function openCloseModal(match: Match) {
  closingMatchId.value = match.id
  closeForm.localGoals = 0
  closeForm.visitorGoals = 0
}

function openTeamsModal(match: Match) {
  editingTeamsMatchId.value = match.id
  teamsForm.localTeamId = match.localTeamId
  teamsForm.visitorTeamId = match.visitorTeamId
}

async function handleActivateMatch(matchId: string) {
  const ok = await activateMatch(matchId)
  if (ok) await loadAll()
}

async function handleCloseMatch() {
  if (!closingMatchId.value) return
  const ok = await closeMatch(
    closingMatchId.value,
    Number(closeForm.localGoals),
    Number(closeForm.visitorGoals)
  )
  if (ok) {
    closingMatchId.value = null
    await loadAll()
  }
}

async function handleUpdateTeams() {
  if (!editingTeamsMatchId.value) return
  const ok = await updateMatchTeams(editingTeamsMatchId.value, teamsForm.localTeamId, teamsForm.visitorTeamId)
  if (ok) {
    editingTeamsMatchId.value = null
    await loadAll()
  }
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <LayoutPageHeader
      title="Gestión de Partidos"
      subtitle="Cierra partidos y actualiza equipos clasificados en fases eliminatorias."
    />

    <!-- Filter Chips -->
    <div class="px-4 -mt-2 overflow-x-auto scrollbar-hide">
      <div class="flex items-center gap-2 pb-2 min-w-max">
        <button
          v-for="item in tabItems"
          :key="item.value"
          class="flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 active:scale-95 whitespace-nowrap"
          :class="[
            tab === item.value
              ? 'border-secondary-500 bg-secondary-500 text-white shadow-md shadow-secondary-500/20'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text-muted) hover:border-(--ui-border-muted)'
          ]"
          @click="tab = item.value as 'active' | 'scheduled' | 'closed'"
        >
          <UIcon
            :name="item.icon"
            class="size-4"
          />
          <span class="text-xs font-bold uppercase tracking-wider">{{ item.label }}</span>
        </button>
      </div>
    </div>

    <div class="px-4 space-y-4">
      <div
        v-if="loading && !matches.length"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-24 rounded-2xl"
        />
      </div>

      <div
        v-else-if="!currentList.length"
        class="text-center py-12 stagger-up"
      >
        <div class="size-16 bg-(--ui-bg-elevated) rounded-full flex items-center justify-center mx-auto mb-4 border border-(--ui-border)">
          <UIcon
            name="i-lucide-trophy"
            class="size-8 text-(--ui-text-muted)"
          />
        </div>
        <p class="font-heading text-lg font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
          Sin partidos
        </p>
        <p class="text-sm text-(--ui-text-muted)">
          No hay partidos en esta categoría.
        </p>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="(match, i) in currentList"
          :key="match.id"
          class="card-elevated p-4 stagger-left"
          :class="`stagger-d${Math.min(i + 1, 12)}`"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-mono text-primary-500 dark:text-primary-400 font-bold uppercase tracking-widest">
                  #{{ match.matchNumber }} · {{ match.phase }}
                </span>
                <span
                  v-if="match.isActive && !match.isClosed"
                  class="live-indicator"
                />
              </div>

              <div class="flex items-center gap-2">
                <p class="font-heading text-base font-bold text-(--ui-text-highlighted) uppercase tracking-tight truncate">
                  {{ match.localTeamName ?? teamName(match.localTeamId) }}
                </p>
                <span class="text-xs text-(--ui-text-muted) font-bold">VS</span>
                <p class="font-heading text-base font-bold text-(--ui-text-highlighted) uppercase tracking-tight truncate">
                  {{ match.visitorTeamName ?? teamName(match.visitorTeamId) }}
                </p>
              </div>

              <div
                v-if="match.isClosed"
                class="mt-2"
              >
                <span class="score-pill inline-flex">
                  {{ match.localGoals }} – {{ match.visitorGoals }}
                </span>
              </div>
            </div>

            <div class="flex gap-2 shrink-0">
              <UButton
                v-if="!match.isClosed"
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-shield-plus"
                class="rounded-xl shadow-sm"
                @click="openTeamsModal(match)"
              />
              <UButton
                v-if="!match.isActive && !match.isClosed"
                size="sm"
                color="secondary"
                variant="solid"
                icon="i-lucide-zap"
                class="font-bold rounded-xl shadow-sm shadow-secondary-500/10"
                @click="handleActivateMatch(match.id)"
              >
                En Vivo
              </UButton>
              <UButton
                v-if="!match.isClosed"
                size="sm"
                color="error"
                variant="solid"
                icon="i-lucide-flag"
                class="font-bold rounded-xl shadow-sm shadow-error-500/10"
                @click="openCloseModal(match)"
              >
                Cerrar
              </UButton>
              <div
                v-else
                class="flex flex-col items-end"
              >
                <UBadge
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="font-bold uppercase tracking-wider rounded-lg"
                >
                  Cerrado
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Cerrar partido -->
    <UModal
      v-model:open="showCloseModal"
      :ui="{
        content: 'rounded-[32px] sm:max-w-md',
        header: 'p-6 border-b border-(--ui-border)',
        body: 'p-6'
      }"
    >
      <template #header>
        <div class="flex flex-col gap-1">
          <h3 class="font-heading text-xl font-black uppercase tracking-tight text-(--ui-text-highlighted)">
            Cerrar Partido
          </h3>
          <p class="text-xs text-(--ui-text-muted)">
            Ingresa el marcador final para calcular puntos.
          </p>
        </div>
      </template>
      <template #body>
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <UFormField label="Goles Local">
              <UInput
                v-model="closeForm.localGoals"
                type="number"
                :min="0"
                :max="20"
                size="lg"
                class="w-full font-heading text-2xl font-bold text-center"
                :ui="{ base: 'text-center' }"
              />
            </UFormField>
            <UFormField label="Goles Visitante">
              <UInput
                v-model="closeForm.visitorGoals"
                type="number"
                :min="0"
                :max="20"
                size="lg"
                class="w-full font-heading text-2xl font-bold text-center"
                :ui="{ base: 'text-center' }"
              />
            </UFormField>
          </div>
          <div class="flex gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              class="flex-1"
              @click="closingMatchId = null"
            >
              Cancelar
            </UButton>
            <UButton
              color="error"
              :loading="loading"
              icon="i-lucide-flag"
              class="flex-1 font-bold"
              @click="handleCloseMatch"
            >
              Confirmar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal: Actualizar equipos -->
    <UModal
      v-model:open="showTeamsModal"
      :ui="{
        content: 'rounded-[32px] sm:max-w-md',
        header: 'p-6 border-b border-(--ui-border)',
        body: 'p-6'
      }"
    >
      <template #header>
        <div class="flex flex-col gap-1">
          <h3 class="font-heading text-xl font-black uppercase tracking-tight text-(--ui-text-highlighted)">
            Equipos Clasificados
          </h3>
          <p class="text-xs text-(--ui-text-muted)">
            Asigna los equipos para esta llave.
          </p>
        </div>
      </template>
      <template #body>
        <div class="space-y-6">
          <UFormField label="Equipo Local">
            <USelect
              v-model="teamsForm.localTeamId"
              :items="teamOptions"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Equipo Visitante">
            <USelect
              v-model="teamsForm.visitorTeamId"
              :items="teamOptions"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <div class="flex gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              class="flex-1"
              @click="editingTeamsMatchId = null"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              :loading="loading"
              icon="i-lucide-save"
              class="flex-1 font-bold"
              @click="handleUpdateTeams"
            >
              Guardar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
