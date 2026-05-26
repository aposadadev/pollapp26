<script setup lang="ts">
const {
  isSupported,
  permission,
  isSubscribed,
  isBrave,
  enableNotifications
} = useNotifications()

const authStore = useAuthStore()
const { isMobile } = useDevice()

// Reactividad del modal
const isOpen = ref(false)

function checkPromptEligibility() {
  if (!isMobile) return
  if (!isSupported.value) return
  if (permission.value !== 'default') return
  if (isSubscribed.value) return
  if (!authStore.isAuthenticated || !authStore.user?.id) return

  const userId = authStore.user.id

  // Verificar exclusiones por preferencias del usuario (específico por usuario)
  const promptStatus = localStorage.getItem(`notif_prompt_status_${userId}`)
  if (promptStatus === 'never') return

  const dismissedSession = sessionStorage.getItem(`notif_dismissed_session_${userId}`)
  if (dismissedSession === 'true') return

  // Si pasa todos los filtros, abrir el modal
  isOpen.value = true
}

// Escuchar cambios de autenticación
watch(
  () => authStore.isAuthenticated,
  (authed) => {
    if (authed) {
      // Un pequeño retraso para no abrumar al usuario recién ingresado
      setTimeout(() => {
        checkPromptEligibility()
      }, 1500)
    } else {
      isOpen.value = false
    }
  },
  { immediate: true }
)

// También revisar al montar por si ya está autenticado
onMounted(() => {
  if (authStore.isAuthenticated) {
    setTimeout(() => {
      checkPromptEligibility()
    }, 1500)
  }
})

async function handleAccept() {
  const success = await enableNotifications()
  if (success) {
    isOpen.value = false
  }
}

function handleNever() {
  const userId = authStore.user?.id
  if (userId) {
    localStorage.setItem(`notif_prompt_status_${userId}`, 'never')
  }
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :prevent-close="true"
    :close="false"
    :ui="{
      content: 'rounded-[32px] max-w-[calc(100vw-32px)] sm:max-w-md border border-(--ui-border) bg-(--ui-bg-elevated) overflow-hidden shadow-2xl mx-auto',
      header: 'p-0',
      body: 'p-0'
    }"
  >
    <template #body>
      <!-- Cabecera del prompt con degradado atractivo y padding responsivo -->
      <div class="relative w-full p-5 xs:p-6 px-4 text-center bg-gradient-to-br from-primary-900 to-primary-700 dark:from-primary-950 dark:to-primary-900 flex flex-col items-center">
        <div class="size-14 xs:size-16 rounded-[22px] bg-white/10 ring-1 ring-white/25 flex items-center justify-center mb-4 shadow-xl backdrop-blur-sm animate-bounce">
          <UIcon
            name="i-lucide-bell-ring"
            class="size-7 xs:size-8 text-secondary-400"
          />
        </div>
        <h3 class="font-heading text-xl xs:text-2xl font-black uppercase text-white tracking-wide text-center leading-tight">
          ¿Activar Recordatorios?
        </h3>
        <p class="text-xs text-primary-200 mt-2 max-w-xs leading-relaxed">
          Te avisaremos antes de que empiecen los partidos del mundial para que no te quedes sin ingresar tus pronósticos.
        </p>
      </div>

      <!-- Opciones / Botones en el Body con padding responsivo -->
      <div class="p-5 xs:p-6 px-4 space-y-3">
        <!-- Sí, activar -->
        <UButton
          color="primary"
          size="lg"
          block
          icon="i-lucide-check-circle"
          class="rounded-[18px] font-black uppercase tracking-wider py-3 shadow-md shadow-primary-600/10 active:scale-98 transition-transform"
          @click="handleAccept"
        >
          Sí, activar
        </UButton>

        <!-- Nunca preguntar -->
        <div class="flex justify-center pt-1">
          <UButton
            color="error"
            variant="ghost"
            size="sm"
            icon="i-lucide-x-circle"
            class="rounded-[18px] font-bold text-xs"
            @click="handleNever"
          >
            Nunca preguntar de nuevo
          </UButton>
        </div>

        <!-- Advertencia específica para Brave dentro del modal -->
        <div
          v-if="isBrave"
          class="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2.5 items-start text-left"
        >
          <UIcon
            name="i-lucide-info"
            class="size-5 text-amber-500 shrink-0 mt-0.5"
          />
          <div class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
            <span class="font-bold">Nota para Brave:</span> Debes activar <code class="bg-amber-500/15 px-1 py-0.5 rounded font-mono text-[10px]">Usar servicios de Google para la mensajería push</code> en <code class="bg-amber-500/15 px-1 py-0.5 rounded font-mono text-[10px]">brave://settings/privacy</code> y reiniciar el navegador.
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
