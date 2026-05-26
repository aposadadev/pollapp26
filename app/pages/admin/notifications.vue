<script setup lang="ts">
import { userRepository } from '~/repositories/user.repository'
import type { Group, UserProfile } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const appStore = useAppStore()
const toast = useToast()
const { getAllGroups } = useAdmin()

// Formulario de Notificaciones
const form = reactive({
  target: 'all' as 'all' | 'group' | 'users' | 'missing-predictions',
  groupId: '',
  selectedUserIds: [] as string[],
  template: 'custom',
  title: '',
  body: '',
  url: '/'
})

const loadingData = ref(true)
const sending = ref(false)

// Datos cargados desde Firestore
const groups = ref<Group[]>([])
const allUsers = ref<UserProfile[]>([])
const searchQuery = ref('')

// Plantillas predefinidas
const templates = [
  { value: 'custom', label: 'Mensaje Personalizado' },
  { value: 'today_matches', label: 'Recordatorio: Partidos de hoy' },
  { value: 'board_activated', label: 'Recordatorio: Tablas aprobadas' },
  { value: 'points_updated', label: 'Aviso: Resultados actualizados' }
]

// Objetivos de envío
const targets = [
  { value: 'all', label: 'Todos los usuarios', icon: 'i-lucide-users' },
  { value: 'group', label: 'Participantes de un Grupo', icon: 'i-lucide-users-2' },
  { value: 'users', label: 'Usuarios Específicos', icon: 'i-lucide-user-check' },
  { value: 'missing-predictions', label: 'Sin Marcadores Hoy', icon: 'i-lucide-clock-3' }
]

// Cargar información inicial
onMounted(async () => {
  appStore.setPageTitle('Notificaciones — Admin')
  try {
    const [fetchedGroups, fetchedUsers] = await Promise.all([
      getAllGroups(appStore.activeTournamentId),
      userRepository.findAll()
    ])
    groups.value = fetchedGroups
    // Filtrar usuarios que tienen al menos un token FCM registrado para optimizar la lista,
    // o mostrar todos para que el admin pueda seleccionarlos.
    // Mostremos todos los usuarios pero ordenados alfabéticamente
    allUsers.value = fetchedUsers.sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )

    if (groups.value.length > 0 && groups.value[0]) {
      form.groupId = groups.value[0].id
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Error al cargar datos',
      description: err instanceof Error ? err.message : String(err),
      color: 'error'
    })
  } finally {
    loadingData.value = false
  }
})

// Auto-rellenar formulario cuando cambia la plantilla
watch(() => form.template, (newVal) => {
  if (newVal === 'today_matches') {
    form.title = '⚽ ¡Partidos de hoy!'
    form.body = 'Hay partidos hoy. Si no has puesto tu marcador, ¿qué esperas? ¡Ingresa ya!'
    form.url = '/'
  } else if (newVal === 'board_activated') {
    form.title = '✅ Tabla Activada'
    form.body = 'Tu tabla ha sido aprobada. ¡Ya puedes ingresar tus marcadores y empezar a jugar!'
    form.url = '/'
  } else if (newVal === 'points_updated') {
    form.title = '📊 Puntos Actualizados'
    form.body = 'Los resultados de los últimos partidos han sido ingresados. ¡Entra a ver tus puntos y posiciones!'
    form.url = '/'
  } else if (newVal === 'custom') {
    form.title = ''
    form.body = ''
    form.url = '/'
  }
})

// Filtrar usuarios en el multiselect
const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return allUsers.value
  return allUsers.value.filter(
    u => u.displayName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
  )
})

// Opciones de grupos para USelect
const groupOptions = computed(() =>
  groups.value.map(g => ({ label: g.name, value: g.id }))
)

// Enviar notificación
async function handleSend() {
  if (!form.title.trim() || !form.body.trim()) {
    toast.add({
      title: 'Validación',
      description: 'Por favor completa el título y el cuerpo del mensaje.',
      color: 'error'
    })
    return
  }

  if (form.target === 'users' && form.selectedUserIds.length === 0) {
    toast.add({
      title: 'Validación',
      description: 'Por favor selecciona al menos un usuario.',
      color: 'error'
    })
    return
  }

  sending.value = true
  try {
    const { $firebaseAuth } = useNuxtApp() as unknown as {
      $firebaseAuth: import('firebase/auth').Auth
    }
    const currentUser = $firebaseAuth.currentUser
    if (!currentUser) {
      toast.add({
        title: 'Error de autenticación',
        description: 'No se pudo obtener la sesión actual.',
        color: 'error'
      })
      return
    }
    const token = await currentUser.getIdToken()

    const response = await $fetch<{ success: boolean, sent: number, failed: number, message?: string }>(
      '/api/admin/send-notifications',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          target: form.target,
          groupId: form.target === 'group' ? form.groupId : undefined,
          userIds: form.target === 'users' ? form.selectedUserIds : undefined,
          title: form.title.trim(),
          body: form.body.trim(),
          url: form.url.trim()
        }
      }
    )

    if (response.success) {
      toast.add({
        title: 'Notificación enviada',
        description: response.message || `Mensajes enviados con éxito: ${response.sent} (Fallidos: ${response.failed})`,
        color: 'secondary'
      })
      // Resetear si es personalizado
      if (form.template === 'custom') {
        form.title = ''
        form.body = ''
        form.url = '/'
        form.selectedUserIds = []
      }
    }
  } catch (err: unknown) {
    const error = err as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error al enviar',
      description: error.data?.statusMessage || error.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    sending.value = false
  }
}

function toggleUserSelection(userId: string) {
  const index = form.selectedUserIds.indexOf(userId)
  if (index > -1) {
    form.selectedUserIds.splice(index, 1)
  } else {
    form.selectedUserIds.push(userId)
  }
}

function selectAllFiltered() {
  filteredUsers.value.forEach((u) => {
    if (!form.selectedUserIds.includes(u.id)) {
      form.selectedUserIds.push(u.id)
    }
  })
}

function clearUserSelection() {
  form.selectedUserIds = []
}
</script>

<template>
  <div class="space-y-6 pb-20 font-sans">
    <LayoutPageHeader
      title="Notificaciones Push"
      subtitle="Envía notificaciones push segmentadas y personalizadas a los usuarios."
    />

    <div class="px-4 max-w-2xl mx-auto space-y-6 stagger-up">
      <div
        v-if="loadingData"
        class="space-y-4"
      >
        <USkeleton class="h-10 w-1/3 rounded-xl" />
        <USkeleton class="h-28 rounded-2xl" />
        <USkeleton class="h-64 rounded-2xl" />
      </div>

      <div
        v-else
        class="space-y-6"
      >
        <!-- Bloque 1: Segmentación / Target -->
        <div class="card-elevated p-6 space-y-4">
          <h3 class="font-heading text-base font-black text-(--ui-text-highlighted) uppercase tracking-wide flex items-center gap-2 border-b border-(--ui-border) pb-2">
            <UIcon
              name="i-lucide-user-cog"
              class="size-5 text-secondary-500"
            />
            1. Destinatarios
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="t in targets"
              :key="t.value"
              type="button"
              class="flex items-center gap-3 p-4 rounded-[20px] border-2 text-left transition-all active:scale-[0.98]"
              :class="[
                form.target === t.value
                  ? 'border-primary-500 bg-primary-500/5 text-primary-950 dark:text-primary-400 font-bold'
                  : 'border-(--ui-border) hover:border-(--ui-border-muted) text-(--ui-text-muted)'
              ]"
              @click="form.target = t.value as any"
            >
              <UIcon
                :name="t.icon"
                class="size-5 shrink-0"
              />
              <span class="text-xs uppercase tracking-wider font-bold">{{ t.label }}</span>
            </button>
          </div>

          <!-- Campos dinámicos según segmentación -->
          <div
            v-if="form.target === 'group'"
            class="pt-2 animate-fade-in"
          >
            <UFormField label="Selecciona el Grupo">
              <USelect
                v-model="form.groupId"
                :items="groupOptions"
                size="lg"
                class="w-full"
                placeholder="Selecciona un grupo..."
              />
            </UFormField>
          </div>

          <div
            v-if="form.target === 'users'"
            class="pt-2 space-y-3 animate-fade-in"
          >
            <div class="flex items-center justify-between gap-3">
              <UInput
                v-model="searchQuery"
                placeholder="Buscar usuario por nombre o correo..."
                icon="i-lucide-search"
                size="sm"
                class="flex-1"
              />
              <UButton
                color="neutral"
                size="xs"
                variant="subtle"
                class="rounded-xl shrink-0"
                @click="selectAllFiltered"
              >
                Marcar Filtro
              </UButton>
              <UButton
                color="error"
                size="xs"
                variant="ghost"
                class="rounded-xl shrink-0"
                @click="clearUserSelection"
              >
                Limpiar
              </UButton>
            </div>

            <!-- Listado de usuarios con checkbox -->
            <div class="max-h-60 overflow-y-auto border border-(--ui-border) rounded-2xl p-2 bg-(--ui-bg) space-y-1">
              <div
                v-for="user in filteredUsers"
                :key="user.id"
                class="flex items-center justify-between p-2 rounded-xl hover:bg-(--ui-bg-elevated) transition-colors cursor-pointer"
                @click="toggleUserSelection(user.id)"
              >
                <div class="flex flex-col min-w-0">
                  <span class="text-xs font-bold text-(--ui-text-highlighted) truncate">
                    {{ user.displayName || 'Sin Nombre' }}
                  </span>
                  <span class="text-[10px] text-(--ui-text-muted) truncate">
                    {{ user.email }}
                  </span>
                </div>
                <UCheckbox
                  :model-value="form.selectedUserIds.includes(user.id)"
                  @click.stop="toggleUserSelection(user.id)"
                />
              </div>
              <div
                v-if="filteredUsers.length === 0"
                class="text-center py-6 text-xs text-(--ui-text-muted)"
              >
                No se encontraron usuarios.
              </div>
            </div>
            <div class="text-right text-[10px] text-(--ui-text-muted) font-bold">
              Seleccionados: {{ form.selectedUserIds.length }} usuarios
            </div>
          </div>
        </div>

        <!-- Bloque 2: Plantillas -->
        <div class="card-elevated p-6 space-y-4">
          <h3 class="font-heading text-base font-black text-(--ui-text-highlighted) uppercase tracking-wide flex items-center gap-2 border-b border-(--ui-border) pb-2">
            <UIcon
              name="i-lucide-sparkles"
              class="size-5 text-secondary-500"
            />
            2. Plantilla Rápida
          </h3>
          <UFormField label="Elige un Mensaje Predefinido">
            <USelect
              v-model="form.template"
              :items="templates"
              size="lg"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Bloque 3: Formulario del mensaje -->
        <div class="card-elevated p-6 space-y-4">
          <h3 class="font-heading text-base font-black text-(--ui-text-highlighted) uppercase tracking-wide flex items-center gap-2 border-b border-(--ui-border) pb-2">
            <UIcon
              name="i-lucide-file-text"
              class="size-5 text-secondary-500"
            />
            3. Mensaje
          </h3>

          <div class="space-y-4">
            <UFormField label="Título de la Notificación">
              <UInput
                v-model="form.title"
                placeholder="Ej: ⚽ ¡Nuevos partidos disponibles!"
                size="lg"
                class="w-full font-bold"
                :maxlength="60"
              />
            </UFormField>

            <UFormField label="Cuerpo del Mensaje">
              <UTextarea
                v-model="form.body"
                placeholder="Escribe el cuerpo de la notificación push..."
                size="lg"
                :rows="3"
                class="w-full"
                :maxlength="200"
              />
            </UFormField>

            <UFormField label="URL de Destino (Redirección al hacer clic)">
              <UInput
                v-model="form.url"
                placeholder="Ej: /"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Botón de Envío -->
        <div class="pt-2">
          <UButton
            color="primary"
            size="lg"
            block
            :loading="sending"
            icon="i-lucide-send-horizontal"
            class="rounded-2xl font-black uppercase tracking-wider py-4 shadow-lg shadow-primary-500/10 active:scale-98 transition-transform"
            @click="handleSend"
          >
            Enviar Notificación Push
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
