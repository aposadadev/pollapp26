<script setup lang="ts">
import type { Team } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
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
  appStore.setPageTitle('Equipos — Admin')
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
  <div class="space-y-6 pb-20">
    <LayoutPageHeader
      title="Gestión de Equipos"
      :subtitle="`${teams.length} equipos registrados en el sistema.`"
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="solid"
          :icon="showCreateForm ? 'i-lucide-x' : 'i-lucide-plus'"
          size="sm"
          class="font-bold rounded-xl"
          @click="showCreateForm = !showCreateForm"
        >
          {{ showCreateForm ? 'Cancelar' : 'Nuevo' }}
        </UButton>
      </template>
    </LayoutPageHeader>

    <div class="px-4 space-y-6">
      <!-- Formulario de creación -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div
          v-if="showCreateForm"
          class="card-elevated p-5 space-y-4 relative overflow-hidden"
        >
          <h2 class="font-heading text-base font-bold text-(--ui-text-highlighted) uppercase tracking-wide flex items-center gap-2">
            <UIcon
              name="i-lucide-circle-plus"
              class="size-5 text-primary-500"
            />
            Nuevo Equipo
          </h2>

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Nombre Completo"
              name="name"
              class="col-span-2"
            >
              <UInput
                v-model="form.name"
                placeholder="Ej. México"
                size="lg"
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
                size="lg"
                class="w-full font-heading uppercase tracking-widest"
              />
            </UFormField>
            <UFormField
              label="Código País (ISO)"
              name="country"
            >
              <UInput
                v-model="form.country"
                placeholder="MX"
                :maxlength="3"
                size="lg"
                class="w-full font-heading uppercase tracking-widest"
              />
            </UFormField>
          </div>
          <UFormField
            label="URL del Logo (Opcional)"
            name="logoUrl"
          >
            <UInput
              v-model="form.logoUrl"
              placeholder="https://... o /img/teams/mex.png"
              icon="i-lucide-image"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <!-- Preview del logo -->
          <div
            v-if="form.logoUrl"
            class="flex items-center gap-4 p-3 bg-(--ui-bg-muted)/30 rounded-2xl border border-(--ui-border)"
          >
            <div class="size-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm shrink-0">
              <img
                :src="form.logoUrl"
                :alt="form.name"
                class="size-10 object-contain"
                @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
              >
            </div>
            <span class="text-xs font-medium text-(--ui-text-muted)">Vista previa del escudo</span>
          </div>

          <div class="flex gap-3 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              class="flex-1"
              @click="cancelCreate"
            >
              Descartar
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-save"
              class="flex-1 font-bold"
              :loading="loading"
              :disabled="!form.name || !form.shortName || !form.country"
              @click="handleCreate"
            >
              Guardar
            </UButton>
          </div>
        </div>
      </Transition>

      <!-- Lista de equipos -->
      <div
        v-if="loading && !teams.length"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 6"
          :key="i"
          class="h-16 rounded-2xl"
        />
      </div>

      <div
        v-else-if="!teams.length"
        class="text-center py-12 stagger-up"
      >
        <div class="size-16 bg-(--ui-bg-elevated) rounded-full flex items-center justify-center mx-auto mb-4 border border-(--ui-border)">
          <UIcon
            name="i-lucide-shield"
            class="size-8 text-(--ui-text-muted)"
          />
        </div>
        <p class="font-heading text-lg font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
          Sin equipos
        </p>
        <p class="text-sm text-(--ui-text-muted)">
          No hay equipos registrados. Comienza creando uno.
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-2"
      >
        <div
          v-for="(team, i) in teams"
          :key="team.id"
          class="flex items-center gap-4 card-elevated p-3 stagger-left"
          :class="`stagger-d${Math.min(i + 1, 12)}`"
        >
          <div class="size-11 shrink-0 flex items-center justify-center rounded-xl bg-(--ui-bg-muted) border border-(--ui-border) p-1.5 shadow-inner">
            <img
              v-if="team.logoUrl"
              :src="team.logoUrl"
              :alt="team.shortName"
              class="size-8 object-contain"
            >
            <span
              v-else
              class="font-heading font-black text-sm text-(--ui-text-muted)"
            >{{ team.shortName }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-heading text-base font-bold text-(--ui-text-highlighted) uppercase tracking-tight truncate leading-tight">
              {{ team.name }}
            </p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] font-mono text-primary-500 dark:text-primary-400 font-bold tracking-widest uppercase">
                {{ team.shortName }}
              </span>
              <span class="text-[10px] text-(--ui-text-muted) font-bold uppercase tracking-wider">
                · {{ team.country }}
              </span>
            </div>
          </div>
          <div class="shrink-0 opacity-20">
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
