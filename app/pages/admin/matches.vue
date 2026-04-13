<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'
import type { Match, Team } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
onMounted(() => appStore.setPageTitle('Partidos — Admin'))

const { loading, closeMatch, updateMatchTeams, getTeams } = useAdmin()
const { matches, loadAll } = useMatches(mundial2026.id)

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
  { label: `Cerrados (${closedMatches.value.length})`, value: 'closed', icon: 'i-lucide-check-circle' }
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

async function handleCloseMatch() {
  if (!closingMatchId.value) return
  const ok = await closeMatch(closingMatchId.value, closeForm.localGoals, closeForm.visitorGoals)
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
  <div class="admin-matches-page">
    <div class="space-y-4">
      <div>
        <h1 class="text-lg font-bold text-(--ui-text-highlighted)">
          Partidos
        </h1>
        <p class="text-sm text-(--ui-text-muted)">
          Cierra partidos y actualiza equipos (fases eliminatorias).
        </p>
      </div>

      <UTabs
        v-model="tab"
        :items="tabItems"
      />

      <div
        v-if="loading && !matches.length"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-20 rounded-xl"
        />
      </div>

      <div
        v-else-if="!currentList.length"
        class="text-center py-8"
      >
        <UIcon
          name="i-lucide-trophy"
          class="size-10 text-(--ui-text-muted) mx-auto mb-2"
        />
        <p class="text-sm text-(--ui-text-muted)">
          No hay partidos en esta categoría.
        </p>
      </div>

      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="match in currentList"
          :key="match.id"
          class="bg-(--ui-bg) border border-(--ui-border) rounded-xl p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-(--ui-text-highlighted) truncate">
                {{ match.localTeamName ?? teamName(match.localTeamId) }}
                <span class="text-(--ui-text-muted) font-normal"> vs </span>
                {{ match.visitorTeamName ?? teamName(match.visitorTeamId) }}
              </p>
              <p class="text-xs text-(--ui-text-muted)">
                #{{ match.matchNumber }} · {{ match.phase }}
              </p>
              <p
                v-if="match.isClosed"
                class="text-xs font-mono mt-0.5 text-[var(--ui-color-secondary-600)] dark:text-[var(--ui-color-secondary-400)]"
              >
                {{ match.localGoals }} – {{ match.visitorGoals }}
              </p>
            </div>
            <div class="flex gap-2 shrink-0">
              <UButton
                v-if="!match.isClosed"
                size="xs"
                color="neutral"
                variant="outline"
                icon="i-lucide-shield"
                @click="openTeamsModal(match)"
              />
              <UButton
                v-if="!match.isClosed"
                size="xs"
                color="error"
                variant="solid"
                icon="i-lucide-flag"
                @click="openCloseModal(match)"
              >
                Cerrar
              </UButton>
              <UBadge
                v-else
                color="neutral"
                variant="soft"
                size="sm"
              >
                Cerrado
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Cerrar partido -->
    <UModal
      v-model:open="showCloseModal"
      title="Cerrar partido"
      description="Ingresa el marcador final."
    >
      <template #body>
        <div class="space-y-4 p-1">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Goles local">
              <UInput
                v-model="closeForm.localGoals"
                type="number"
                :min="0"
                :max="20"
                size="md"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Goles visitante">
              <UInput
                v-model="closeForm.visitorGoals"
                type="number"
                :min="0"
                :max="20"
                size="md"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex gap-2 justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              @click="closingMatchId = null"
            >
              Cancelar
            </UButton>
            <UButton
              color="error"
              :loading="loading"
              icon="i-lucide-flag"
              @click="handleCloseMatch"
            >
              Confirmar cierre
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal: Actualizar equipos -->
    <UModal
      v-model:open="showTeamsModal"
      title="Actualizar equipos"
      description="Asigna los equipos clasificados."
    >
      <template #body>
        <div class="space-y-4 p-1">
          <UFormField label="Equipo local">
            <USelect
              v-model="teamsForm.localTeamId"
              :options="teamOptions"
              size="md"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Equipo visitante">
            <USelect
              v-model="teamsForm.visitorTeamId"
              :options="teamOptions"
              size="md"
              class="w-full"
            />
          </UFormField>
          <div class="flex gap-2 justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              @click="editingTeamsMatchId = null"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              :loading="loading"
              icon="i-lucide-save"
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
