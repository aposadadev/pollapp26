<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const groupsComposable = useGroups(appStore.activeTournamentId)

const groups = groupsComposable.groups
const loading = groupsComposable.loading
const loadGroups = groupsComposable.loadGroups
const searchByCode = groupsComposable.searchByCode
const composableSearchError = groupsComposable.searchError
const creating = groupsComposable.creating

const TOURNAMENT_ID = appStore.activeTournamentId
const requestingBoardId = ref<string | null>(null)

onMounted(async () => {
  appStore.setPageTitle('Grupos')
  await loadGroups()
})

const searchCode = ref('')
const searchResult = ref<import('~/types').Group | null>(null)
const searchLoading = ref(false)
const searchError = ref('')

async function handleSearch() {
  if (!searchCode.value.trim()) return
  searchLoading.value = true
  searchError.value = ''
  const result = await searchByCode(searchCode.value.trim())
  if (result) {
    searchResult.value = result
  } else {
    searchError.value = composableSearchError.value ?? 'No se encontró ningún grupo con ese código.'
    searchResult.value = null
  }
  searchLoading.value = false
}

async function handleRequestBoard(groupId: string) {
  requestingBoardId.value = groupId
  await groupsComposable.requestBoard(groupId, TOURNAMENT_ID)
  requestingBoardId.value = null
  await loadGroups()
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  useToast().add({ title: 'Código copiado', color: 'secondary' })
}

// Crear grupo
const showCreateModal = ref(false)
const newGroupName = ref('')
const createdGroup = ref<import('~/types').Group | null>(null)

async function handleCreateGroup() {
  if (!newGroupName.value.trim()) return
  const result = await groupsComposable.createGroup(newGroupName.value.trim())
  if (result) {
    createdGroup.value = result
    newGroupName.value = ''
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  createdGroup.value = null
  newGroupName.value = ''
}
</script>

<template>
  <div class="font-sans">
    <!-- Header con gradiente tri-color -->
    <LayoutPageHeader
      title="Grupos"
      subtitle="Administra tus pollas mundialistas"
    />

    <div class="p-4 space-y-5 pb-24">
      <!-- Búsqueda por código + crear grupo -->
      <div class="stagger-up stagger-d1 space-y-3">
        <div class="flex gap-2">
          <UInput
            v-model="searchCode"
            placeholder="Código del grupo..."
            class="flex-1 font-mono uppercase"
            size="md"
            icon="i-lucide-hash"
            :maxlength="6"
            @keyup.enter="handleSearch"
          />
          <UButton
            color="primary"
            icon="i-lucide-search"
            :loading="searchLoading"
            @click="handleSearch"
          >
            Buscar
          </UButton>
        </div>
        <p
          v-if="searchError"
          class="mt-2 text-xs text-[var(--ui-color-error-500)]"
        >
          {{ searchError }}
        </p>
        <div
          v-if="searchResult"
          class="mt-3"
        >
          <GroupCard
            :group="{ ...searchResult, userBoardIsActive: false, userBoardIsPending: false }"
            :loading="requestingBoardId === searchResult.id"
            @request-board="handleRequestBoard"
          />
        </div>

        <!-- Separador -->
        <div class="flex items-center gap-3 my-1">
          <div class="flex-1 h-px bg-(--ui-border)" />
          <span class="text-[11px] font-bold text-(--ui-text-muted) uppercase tracking-wider">o</span>
          <div class="flex-1 h-px bg-(--ui-border)" />
        </div>

        <UButton
          color="secondary"
          variant="soft"
          icon="i-lucide-plus-circle"
          class="w-full font-bold rounded-xl"
          @click="showCreateModal = true"
        >
          Crear nuevo grupo
        </UButton>
      </div>

      <!-- Mis grupos -->
      <div class="stagger-up stagger-d2">
        <h2 class="font-heading text-lg font-semibold text-(--ui-text-highlighted) uppercase tracking-wide mb-3">
          Mis grupos
        </h2>

        <div
          v-if="loading"
          class="space-y-3"
        >
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-28 rounded-xl"
          />
        </div>

        <div
          v-else-if="groups.length"
          class="space-y-3"
        >
          <div
            v-for="(group, i) in groups"
            :key="group.id"
            class="card-elevated overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 stagger-up"
            :class="`stagger-d${Math.min(i + 3, 12)}`"
          >
            <div class="p-4 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-heading font-black text-sm text-(--ui-text-highlighted) uppercase tracking-wide truncate">
                  {{ group.name }}
                </h3>
                <div class="flex items-center gap-2 mt-2">
                  <button
                    class="flex items-center gap-1.5 text-[11px] bg-(--ui-bg-muted) px-2.5 py-1 rounded-lg font-mono font-bold
                           text-primary-600 dark:text-primary-400
                           hover:bg-primary-500/10 transition-colors"
                    @click="copyCode(group.code)"
                  >
                    <UIcon
                      name="i-lucide-hash"
                      class="size-3"
                    />
                    {{ group.code }}
                    <UIcon
                      name="i-lucide-copy"
                      class="size-3 opacity-60"
                    />
                  </button>
                  <UBadge
                    v-if="group.userBoardIsActive"
                    color="secondary"
                    variant="soft"
                    size="xs"
                    class="rounded-lg font-bold"
                  >
                    Activa
                  </UBadge>
                  <UBadge
                    v-else-if="group.userBoardIsPending"
                    color="neutral"
                    variant="soft"
                    size="xs"
                    class="rounded-lg font-bold"
                  >
                    Pendiente
                  </UBadge>
                </div>
              </div>
            </div>

            <div class="px-4 pb-4 flex gap-2 border-t border-(--ui-border)/50 pt-3">
              <UButton
                v-if="group.userBoardIsActive && group.userBoardId"
                :to="`/board/${group.userBoardId}`"
                color="primary"
                variant="solid"
                size="sm"
                class="flex-1 font-bold rounded-xl"
                icon="i-lucide-clipboard-list"
              >
                Mi tabla
              </UButton>
              <UButton
                v-else-if="group.userBoardIsPending"
                color="neutral"
                variant="ghost"
                size="sm"
                class="flex-1 rounded-xl"
                disabled
                icon="i-lucide-clock"
              >
                Pendiente de activación
              </UButton>
              <UButton
                v-else
                color="primary"
                variant="outline"
                size="sm"
                class="flex-1 font-bold rounded-xl"
                icon="i-lucide-plus"
                :loading="requestingBoardId === group.id"
                @click="handleRequestBoard(group.id)"
              >
                Pedir tabla
              </UButton>
              <UButton
                :to="`/groups/${group.id}/positions`"
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-trophy"
                class="rounded-xl"
              />
            </div>
          </div>
        </div>

        <div
          v-else
          class="card-elevated text-center py-10 stagger-up"
        >
          <div class="size-14 bg-(--ui-bg-muted) rounded-full flex items-center justify-center mx-auto mb-3 border border-(--ui-border)">
            <UIcon
              name="i-lucide-users"
              class="size-7 text-(--ui-text-muted)"
            />
          </div>
          <p class="font-heading text-base font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
            Sin grupos
          </p>
          <p class="text-xs text-(--ui-text-muted) mt-1">
            Busca un grupo por código o crea uno nuevo.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal Crear grupo -->
    <UModal
      v-model:open="showCreateModal"
      :ui="{ content: 'max-w-sm mx-4' }"
    >
      <template #content>
        <div class="p-6 space-y-5">
          <!-- Éxito: mostrar código -->
          <div
            v-if="createdGroup"
            class="text-center space-y-4"
          >
            <div class="size-16 gradient-tricolor rounded-full flex items-center justify-center mx-auto">
              <UIcon
                name="i-lucide-party-popper"
                class="size-8 text-white"
              />
            </div>
            <div>
              <p class="font-heading text-lg font-black text-(--ui-text-highlighted) uppercase tracking-wide">
                ¡Grupo creado!
              </p>
              <p class="text-sm text-(--ui-text-muted) mt-1">
                Comparte este código con tus amigos
              </p>
            </div>
            <button
              class="flex items-center justify-center gap-2 w-full bg-(--ui-bg-muted) px-4 py-3 rounded-xl font-mono text-2xl font-black tracking-widest text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 transition-colors"
              @click="copyCode(createdGroup.code)"
            >
              {{ createdGroup.code }}
              <UIcon
                name="i-lucide-copy"
                class="size-5 opacity-60"
              />
            </button>
            <p class="text-[11px] text-(--ui-text-muted)">
              Toca el código para copiarlo
            </p>
            <UButton
              color="primary"
              class="w-full font-bold"
              @click="closeCreateModal"
            >
              Listo
            </UButton>
          </div>

          <!-- Formulario -->
          <div
            v-else
            class="space-y-4"
          >
            <div>
              <p class="font-heading text-base font-black text-(--ui-text-highlighted) uppercase tracking-wide">
                Nuevo grupo
              </p>
              <p class="text-sm text-(--ui-text-muted) mt-1">
                Se generará un código único para invitar a tus amigos.
              </p>
            </div>
            <UInput
              v-model="newGroupName"
              placeholder="Nombre del grupo..."
              size="lg"
              icon="i-lucide-users"
              :maxlength="40"
              autofocus
              @keyup.enter="handleCreateGroup"
            />
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                class="flex-1"
                @click="closeCreateModal"
              >
                Cancelar
              </UButton>
              <UButton
                color="secondary"
                class="flex-1 font-bold"
                icon="i-lucide-plus-circle"
                :loading="creating"
                :disabled="!newGroupName.trim()"
                @click="handleCreateGroup"
              >
                Crear
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
