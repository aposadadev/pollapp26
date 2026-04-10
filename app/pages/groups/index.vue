<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'

definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const groupsComposable = useGroups(mundial2026.id)

const groups = groupsComposable.groups
const loading = groupsComposable.loading
const loadGroups = groupsComposable.loadGroups

const TOURNAMENT_ID = mundial2026.id
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
  const { searchByCode } = useGroups(TOURNAMENT_ID)
  const result = await searchByCode(searchCode.value.trim())
  if (result) {
    searchResult.value = result
  } else {
    searchError.value = 'No se encontró ningún grupo con ese código.'
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
</script>

<template>
  <div>
    <!-- Header con gradiente tri-color -->
    <LayoutPageHeader
      title="Grupos"
      subtitle="Administra tus pollas mundialistas"
    />

    <div class="p-4 space-y-5 pb-24">
      <!-- Búsqueda por código -->
      <div class="stagger-up stagger-d1">
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
            class="stagger-up"
            :class="`stagger-d${Math.min(i + 3, 12)}`"
          >
            <UCard class="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="font-heading font-semibold text-sm text-(--ui-text-highlighted) uppercase tracking-wide truncate">
                    {{ group.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-1.5">
                    <button
                      class="flex items-center gap-1 text-xs bg-(--ui-bg-muted) px-2 py-0.5 rounded-lg font-mono
                             text-[var(--ui-color-primary-600)] dark:text-[var(--ui-color-primary-400)]
                             hover:bg-(--ui-bg-muted)/80 transition-colors"
                      @click="copyCode(group.code)"
                    >
                      {{ group.code }}
                      <UIcon
                        name="i-lucide-copy"
                        class="size-3"
                      />
                    </button>
                    <UBadge
                      v-if="group.userBoardIsActive"
                      color="secondary"
                      variant="soft"
                      size="xs"
                    >
                      <UIcon
                        name="i-lucide-check-circle"
                        class="size-3 mr-0.5"
                      />
                      Activa
                    </UBadge>
                    <UBadge
                      v-else-if="group.userBoardIsPending"
                      color="neutral"
                      variant="soft"
                      size="xs"
                    >
                      <UIcon
                        name="i-lucide-clock"
                        class="size-3 mr-0.5"
                      />
                      Pendiente
                    </UBadge>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="flex gap-2">
                  <UButton
                    v-if="group.userBoardIsActive && group.userBoardId"
                    :to="`/board/${group.userBoardId}`"
                    color="primary"
                    variant="solid"
                    size="sm"
                    class="flex-1"
                    icon="i-lucide-clipboard-list"
                  >
                    Mi tabla
                  </UButton>
                  <UButton
                    v-else-if="group.userBoardIsPending"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="flex-1"
                    disabled
                    icon="i-lucide-clock"
                  >
                    Esperando activación
                  </UButton>
                  <UButton
                    v-else
                    color="primary"
                    variant="outline"
                    size="sm"
                    class="flex-1"
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
                  />
                </div>
              </template>
            </UCard>
          </div>
        </div>

        <UCard
          v-else
          class="text-center py-8"
        >
          <UIcon
            name="i-lucide-users"
            class="size-10 text-(--ui-text-muted) mx-auto mb-3"
          />
          <p class="text-sm text-(--ui-text-muted)">
            No perteneces a ningún grupo aún.
          </p>
          <p class="text-xs text-(--ui-text-muted) mt-1">
            Busca un grupo por su código de invitación.
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>
