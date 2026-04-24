<script setup lang="ts">
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'

definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const authStore = useAuthStore()
const { logout } = useAuth()
const toast = useToast()
const { $firebaseAuth } = useNuxtApp()

onMounted(() => {
  appStore.setPageTitle('Mi perfil')
})

// Editar nombre
const editingName = ref(false)
const newDisplayName = ref(authStore.user?.displayName ?? '')
const savingName = ref(false)

async function saveDisplayName() {
  if (!newDisplayName.value.trim() || !$firebaseAuth.currentUser) return
  savingName.value = true
  try {
    await updateProfile($firebaseAuth.currentUser, { displayName: newDisplayName.value.trim() })
    // Sync store
    if (authStore.user) {
      authStore.user = { ...authStore.user, displayName: newDisplayName.value.trim() }
    }
    editingName.value = false
    toast.add({ title: 'Nombre actualizado', color: 'secondary' })
  } catch {
    toast.add({ title: 'Error al actualizar', description: 'Intenta de nuevo.', color: 'error' })
  } finally {
    savingName.value = false
  }
}

// Cambiar contraseña
const showPasswordForm = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)
const passwordError = ref('')

async function savePassword() {
  passwordError.value = ''
  if (newPassword.value.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Las contraseñas no coinciden.'
    return
  }
  const user = $firebaseAuth.currentUser
  if (!user || !user.email) return

  savingPassword.value = true
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword.value)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword.value)
    toast.add({ title: 'Contraseña actualizada', color: 'secondary' })
    showPasswordForm.value = false
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      passwordError.value = 'La contraseña actual es incorrecta.'
    } else {
      passwordError.value = 'No pudimos actualizar la contraseña. Intenta de nuevo.'
    }
  } finally {
    savingPassword.value = false
  }
}

const initials = computed(() => {
  const name = authStore.user?.displayName ?? authStore.user?.email ?? '?'
  return name.slice(0, 2).toUpperCase()
})

const memberSince = computed(() => {
  const date = authStore.user?.createdAt
  if (!date) return ''
  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
    date instanceof Date ? date : new Date(date)
  )
})

// ── Notificaciones ────────────────────────────────────────────────────────────
const {
  isSupported: notifSupported,
  isSubscribed,
  permission: notifPermission,
  prefs: notifPrefs,
  loading: notifLoading,
  enableNotifications,
  disableNotifications,
  savePrefs
} = useNotifications()

const localPrefs = ref({ ...notifPrefs.value })
watch(notifPrefs, (p) => {
  localPrefs.value = { ...p }
})

const reminderOptions = [
  { label: '1 hora antes', value: 1 },
  { label: '2 horas antes', value: 2 },
  { label: '4 horas antes', value: 4 }
]

async function handleToggleNotifications() {
  if (isSubscribed.value) {
    await disableNotifications()
  } else {
    await enableNotifications()
  }
}

async function handleSavePrefs() {
  await savePrefs(localPrefs.value)
}
</script>

<template>
  <div class="font-sans">
    <LayoutPageHeader
      title="Mi perfil"
      subtitle="Gestiona tu cuenta"
    />

    <div class="p-4 space-y-4 pb-24">
      <!-- Avatar + info básica -->
      <div class="card-elevated p-6 flex flex-col items-center gap-3 stagger-up stagger-d1">
        <div class="size-20 rounded-full gradient-tricolor flex items-center justify-center shadow-lg">
          <span class="font-heading text-2xl font-black text-white">{{ initials }}</span>
        </div>
        <div class="text-center">
          <p class="font-heading text-lg font-black text-(--ui-text-highlighted) uppercase tracking-wide">
            {{ authStore.user?.displayName || 'Sin nombre' }}
          </p>
          <p class="text-sm text-(--ui-text-muted) mt-0.5">
            {{ authStore.user?.email }}
          </p>
          <p
            v-if="memberSince"
            class="text-xs text-(--ui-text-muted) mt-1"
          >
            Miembro desde {{ memberSince }}
          </p>
        </div>
        <UBadge
          v-if="authStore.isAdmin"
          color="primary"
          variant="solid"
          size="sm"
          class="rounded-full font-bold uppercase tracking-wider"
        >
          <UIcon
            name="i-lucide-shield-check"
            class="size-3 mr-1"
          />
          Admin
        </UBadge>
      </div>

      <!-- Editar nombre -->
      <div class="card-elevated p-4 stagger-up stagger-d2">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-user"
              class="size-4 text-primary-500"
            />
            <span class="font-heading text-sm font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
              Nombre
            </span>
          </div>
          <UButton
            v-if="!editingName"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-pencil"
            @click="editingName = true; newDisplayName = authStore.user?.displayName ?? ''"
          >
            Editar
          </UButton>
        </div>

        <div
          v-if="!editingName"
          class="text-sm text-(--ui-text)"
        >
          {{ authStore.user?.displayName || 'Sin nombre' }}
        </div>
        <div
          v-else
          class="space-y-2"
        >
          <UInput
            v-model="newDisplayName"
            placeholder="Tu nombre..."
            size="sm"
            autofocus
            :maxlength="40"
          />
          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              class="flex-1"
              @click="editingName = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="xs"
              class="flex-1"
              :loading="savingName"
              :disabled="!newDisplayName.trim()"
              @click="saveDisplayName"
            >
              Guardar
            </UButton>
          </div>
        </div>
      </div>

      <!-- Cambiar contraseña -->
      <div class="card-elevated p-4 stagger-up stagger-d3">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-lock"
              class="size-4 text-primary-500"
            />
            <span class="font-heading text-sm font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
              Contraseña
            </span>
          </div>
          <UButton
            v-if="!showPasswordForm"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-key"
            @click="showPasswordForm = true"
          >
            Cambiar
          </UButton>
        </div>

        <div
          v-if="showPasswordForm"
          class="space-y-3"
        >
          <UInput
            v-model="currentPassword"
            type="password"
            placeholder="Contraseña actual"
            size="sm"
            icon="i-lucide-lock"
          />
          <UInput
            v-model="newPassword"
            type="password"
            placeholder="Nueva contraseña"
            size="sm"
            icon="i-lucide-lock-keyhole"
          />
          <UInput
            v-model="confirmPassword"
            type="password"
            placeholder="Confirmar nueva contraseña"
            size="sm"
            icon="i-lucide-lock-keyhole"
          />
          <p
            v-if="passwordError"
            class="text-xs text-error-500"
          >
            {{ passwordError }}
          </p>
          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              class="flex-1"
              @click="showPasswordForm = false; passwordError = ''"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              size="xs"
              class="flex-1"
              :loading="savingPassword"
              @click="savePassword"
            >
              Actualizar
            </UButton>
          </div>
        </div>
        <p
          v-else
          class="text-sm text-(--ui-text-muted)"
        >
          ••••••••
        </p>
      </div>

      <!-- Notificaciones Push -->
      <div
        v-if="notifSupported"
        class="card-elevated p-4 stagger-up stagger-d4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-bell"
              class="size-4 text-primary-500"
            />
            <span class="font-heading text-sm font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
              Notificaciones
            </span>
          </div>
          <UToggle
            :model-value="isSubscribed"
            :loading="notifLoading"
            color="secondary"
            @update:model-value="handleToggleNotifications"
          />
        </div>

        <!-- Permiso denegado -->
        <p
          v-if="notifPermission === 'denied'"
          class="text-xs text-error-500"
        >
          Las notificaciones están bloqueadas en tu navegador. Ve a Configuración → Privacidad para habilitarlas.
        </p>

        <!-- Configuración de prefs cuando está activo -->
        <div
          v-else-if="isSubscribed"
          class="space-y-3 mt-2 pt-3 border-t border-(--ui-border)/50"
        >
          <!-- Recordatorio de partido -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-(--ui-text)">
                Recordatorio de partido
              </p>
              <p class="text-xs text-(--ui-text-muted)">
                Te avisamos antes de que empiece
              </p>
            </div>
            <UToggle
              v-model="localPrefs.matchReminder"
              color="secondary"
              size="sm"
            />
          </div>

          <!-- Cuántas horas antes -->
          <div
            v-if="localPrefs.matchReminder"
            class="flex items-center justify-between"
          >
            <p class="text-sm text-(--ui-text-muted)">
              Anticipación
            </p>
            <div class="flex gap-1">
              <button
                v-for="opt in reminderOptions"
                :key="opt.value"
                class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                :class="[
                  localPrefs.reminderHoursBeforeMatch === opt.value
                    ? 'bg-secondary-500 text-white'
                    : 'bg-(--ui-bg-muted) text-(--ui-text-muted) hover:bg-(--ui-bg-elevated)'
                ]"
                @click="localPrefs.reminderHoursBeforeMatch = opt.value as 1 | 2 | 4"
              >
                {{ opt.label.split(' ')[0] }}h
              </button>
            </div>
          </div>

          <UButton
            color="secondary"
            variant="soft"
            size="xs"
            class="w-full font-bold"
            :loading="notifLoading"
            @click="handleSavePrefs"
          >
            Guardar preferencias
          </UButton>
        </div>

        <!-- Descripción cuando no está activo -->
        <p
          v-else
          class="text-xs text-(--ui-text-muted)"
        >
          Actívalas para recibir recordatorios antes de los partidos.
        </p>
      </div>

      <!-- Cerrar sesión -->
      <div class="stagger-up stagger-d5">
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-log-out"
          class="w-full font-bold rounded-xl"
          @click="logout"
        >
          Cerrar sesión
        </UButton>
      </div>
    </div>
  </div>
</template>
