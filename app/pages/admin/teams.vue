<script setup lang="ts">
import type { Team } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
onMounted(() => appStore.setPageTitle('Equipos — Admin'))

const { loading, getTeams, createTeam } = useAdmin()

const teams = ref<Team[]>([])
const showCreateForm = ref(false)

const form = reactive({
  name: '',
  shortName: '',
  country: '',
  logoUrl: ''
})

onMounted(async () => {
  teams.value = await getTeams()
})

async function handleCreate() {
  if (!form.name || !form.shortName || !form.country) return
  const ok = await createTeam(form.name, form.shortName, form.logoUrl, form.country)
  if (ok) {
    teams.value = await getTeams()
    form.name = ''
    form.shortName = ''
    form.country = ''
    form.logoUrl = ''
    showCreateForm.value = false
  }
}

function cancelCreate() {
  showCreateForm.value = false
  form.name = ''
  form.shortName = ''
  form.country = ''
  form.logoUrl = ''
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-bold text-(--ui-text-highlighted)">
          Equipos
        </h1>
        <p class="text-sm text-(--ui-text-muted)">
          {{ teams.length }} equipos registrados
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        size="sm"
        @click="showCreateForm = !showCreateForm"
      >
        Nuevo
      </UButton>
    </div>

    <!-- Formulario de creación -->
    <UCard v-if="showCreateForm">
      <template #header>
        <h2 class="text-sm font-semibold text-(--ui-text-highlighted)">
          Nuevo equipo
        </h2>
      </template>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <UFormField
            label="Nombre completo"
            name="name"
            class="col-span-2"
          >
            <UInput
              v-model="form.name"
              placeholder="México"
              size="md"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Abreviatura"
            name="shortName"
          >
            <UInput
              v-model="form.shortName"
              placeholder="MEX"
              :maxlength="3"
              class="w-full font-mono uppercase"
            />
          </UFormField>
          <UFormField
            label="País (código ISO)"
            name="country"
          >
            <UInput
              v-model="form.country"
              placeholder="MX"
              :maxlength="3"
              class="w-full font-mono uppercase"
            />
          </UFormField>
        </div>
        <UFormField
          label="URL del logo"
          name="logoUrl"
        >
          <UInput
            v-model="form.logoUrl"
            placeholder="https://... o /img/teams/mex.png"
            icon="i-lucide-image"
            class="w-full"
          />
        </UFormField>
        <!-- Preview del logo -->
        <div
          v-if="form.logoUrl"
          class="flex items-center gap-3"
        >
          <img
            :src="form.logoUrl"
            :alt="form.name"
            class="size-10 object-contain rounded"
            @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
          >
          <span class="text-xs text-(--ui-text-muted)">Vista previa del logo</span>
        </div>
        <div class="flex gap-2 justify-end pt-1">
          <UButton
            color="neutral"
            variant="ghost"
            @click="cancelCreate"
          >
            Cancelar
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            :loading="loading"
            :disabled="!form.name || !form.shortName || !form.country"
            @click="handleCreate"
          >
            Guardar
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Lista de equipos -->
    <div
      v-if="loading && !teams.length"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-14 rounded-xl"
      />
    </div>

    <div
      v-else-if="!teams.length"
      class="text-center py-10"
    >
      <UIcon
        name="i-lucide-shield"
        class="size-10 text-(--ui-text-muted) mx-auto mb-2"
      />
      <p class="text-sm text-(--ui-text-muted)">
        No hay equipos registrados. Crea el primero.
      </p>
    </div>

    <div
      v-else
      class="space-y-1"
    >
      <div
        v-for="team in teams"
        :key="team.id"
        class="flex items-center gap-3 bg-(--ui-bg) border border-(--ui-border) rounded-xl px-3 py-2"
      >
        <div class="size-9 shrink-0 flex items-center justify-center rounded-lg bg-(--ui-bg-elevated)">
          <img
            v-if="team.logoUrl"
            :src="team.logoUrl"
            :alt="team.shortName"
            class="size-8 object-contain"
          >
          <span
            v-else
            class="text-xs font-bold text-(--ui-text-muted)"
          >{{ team.shortName }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-(--ui-text-highlighted) truncate">
            {{ team.name }}
          </p>
          <p class="text-xs text-(--ui-text-muted) font-mono">
            {{ team.shortName }} · {{ team.country }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
