<script setup lang="ts">
/**
 * ProfileApiKey — Sección de gestión de la API Key en el perfil del usuario.
 *
 * Permite generar, regenerar y revocar la API Key de la cuenta.
 * La clave plana se muestra una única vez al generarse.
 */

const toast = useToast()
const { $firebaseAuth } = useNuxtApp() as unknown as {
  $firebaseAuth: import('firebase/auth').Auth
}

// ── State ──────────────────────────────────────────────────────────────────────
interface ApiKeyMeta {
  prefix: string
  name: string
  status: string
  createdAt: string | null
  lastUsedAt: string | null
}

const apiKey = ref<ApiKeyMeta | null>(null)
const loadingKey = ref(true)
const generatingKey = ref(false)
const revokingKey = ref(false)
const showGenerateModal = ref(false)
const newKeyName = ref('')
const generatedPlaintext = ref<string | null>(null)
const copiedToClipboard = ref(false)

// ── Load existing key ─────────────────────────────────────────────────────────
async function loadApiKey() {
  loadingKey.value = true
  try {
    const token = await $firebaseAuth.currentUser?.getIdToken()
    if (!token) return
    const result = await $fetch<{ exists: boolean, key: ApiKeyMeta | null }>('/api/api-keys', {
      headers: { Authorization: `Bearer ${token}` }
    })
    apiKey.value = result.exists ? result.key : null
  } catch (err) {
    console.error('[ProfileApiKey] Error loading api key:', err)
  } finally {
    loadingKey.value = false
  }
}

// ── Generate key ──────────────────────────────────────────────────────────────
async function generateKey() {
  generatingKey.value = true
  try {
    const token = await $firebaseAuth.currentUser?.getIdToken()
    if (!token) return
    const result = await $fetch<{ plaintext: string, prefix: string, name: string, createdAt: string }>('/api/api-keys', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { name: newKeyName.value.trim() || 'Mi API Key' }
    })
    generatedPlaintext.value = result.plaintext
    apiKey.value = { prefix: result.prefix, name: result.name, status: 'active', createdAt: result.createdAt, lastUsedAt: null }
    showGenerateModal.value = false
    newKeyName.value = ''
  } catch (err) {
    toast.add({ title: 'Error al generar la API Key', description: (err as Error).message, color: 'error' })
  } finally {
    generatingKey.value = false
  }
}

// ── Revoke key ────────────────────────────────────────────────────────────────
async function revokeKey() {
  revokingKey.value = true
  try {
    const token = await $firebaseAuth.currentUser?.getIdToken()
    if (!token) return
    await $fetch('/api/api-keys', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    apiKey.value = null
    generatedPlaintext.value = null
    toast.add({ title: 'API Key revocada', color: 'secondary', duration: 3000 })
  } catch (err) {
    toast.add({ title: 'Error al revocar la API Key', description: (err as Error).message, color: 'error' })
  } finally {
    revokingKey.value = false
  }
}

// ── Copy to clipboard ─────────────────────────────────────────────────────────
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedToClipboard.value = true
    setTimeout(() => { copiedToClipboard.value = false }, 2000)
  } catch {
    toast.add({ title: 'Error al copiar', color: 'error' })
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

onMounted(loadApiKey)
</script>

<template>
  <div class="card-elevated p-4 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-bot" class="size-4 text-primary-500" />
        <span class="font-heading text-sm font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
          API Externa
        </span>
      </div>
      <UButton
        v-if="!loadingKey && !apiKey"
        color="primary"
        variant="soft"
        size="xs"
        icon="i-lucide-key"
        @click="showGenerateModal = true"
      >
        Generar
      </UButton>
    </div>

    <!-- Loading -->
    <USkeleton v-if="loadingKey" class="h-12 rounded-xl" />

    <!-- No key -->
    <p
      v-else-if="!apiKey"
      class="text-sm text-(--ui-text-muted)"
    >
      Conecta scripts o bots para predecir automáticamente. Genera tu clave para comenzar.
    </p>

    <!-- Key exists -->
    <template v-else>
      <!-- Generated plaintext warning — only shown right after creation -->
      <div
        v-if="generatedPlaintext"
        class="p-4 rounded-xl border-2 border-amber-500/60 bg-amber-500/5 space-y-2"
      >
        <div class="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
          <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
          Copia tu API Key ahora — no la volverás a ver
        </div>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-(--ui-bg-muted) border border-(--ui-border) rounded-lg px-3 py-2 text-xs font-mono break-all text-(--ui-text-highlighted) select-all">
            {{ generatedPlaintext }}
          </code>
          <UButton
            :icon="copiedToClipboard ? 'i-lucide-check' : 'i-lucide-copy'"
            :color="copiedToClipboard ? 'success' : 'neutral'"
            variant="soft"
            size="xs"
            class="shrink-0 rounded-lg"
            @click="copyToClipboard(generatedPlaintext!)"
          />
        </div>
      </div>

      <!-- Key metadata -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="size-9 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-key" class="size-4 text-primary-500" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-(--ui-text-highlighted) truncate">{{ apiKey.name }}</p>
            <code class="text-xs text-(--ui-text-muted) font-mono">{{ apiKey.prefix }}...</code>
          </div>
        </div>
        <UBadge color="success" variant="soft" class="rounded-full font-bold uppercase text-[10px] tracking-widest shrink-0">
          Activa
        </UBadge>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-(--ui-bg-muted) rounded-xl p-3">
          <p class="text-(--ui-text-muted) uppercase tracking-wider font-bold text-[10px] mb-0.5">Creada</p>
          <p class="text-(--ui-text-highlighted) font-medium leading-tight">{{ formatDate(apiKey.createdAt) }}</p>
        </div>
        <div class="bg-(--ui-bg-muted) rounded-xl p-3">
          <p class="text-(--ui-text-muted) uppercase tracking-wider font-bold text-[10px] mb-0.5">Último uso</p>
          <p class="text-(--ui-text-highlighted) font-medium leading-tight">{{ formatDate(apiKey.lastUsedAt) }}</p>
        </div>
      </div>

      <div class="flex gap-2 pt-1">
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="soft"
          size="xs"
          class="rounded-full"
          @click="showGenerateModal = true"
        >
          Regenerar
        </UButton>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          size="xs"
          class="rounded-full"
          :loading="revokingKey"
          @click="revokeKey"
        >
          Revocar
        </UButton>
      </div>
    </template>

    <!-- Generate / Regenerate modal -->
    <UModal v-model:open="showGenerateModal">
      <template #content>
        <div class="p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <UIcon name="i-lucide-key" class="size-5 text-primary-500" />
            </div>
            <div>
              <p class="font-bold text-(--ui-text-highlighted)">
                {{ apiKey ? 'Regenerar API Key' : 'Generar API Key' }}
              </p>
              <p class="text-xs text-(--ui-text-muted)">
                {{ apiKey ? 'La clave anterior quedará inactiva inmediatamente.' : 'Clave para conectar servicios externos a tu cuenta.' }}
              </p>
            </div>
          </div>

          <div
            v-if="apiKey"
            class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2"
          >
            <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
            <span>Regenerar invalidará la clave actual. Cualquier servicio que la use dejará de funcionar.</span>
          </div>

          <UInput
            v-model="newKeyName"
            placeholder="Nombre de la clave (ej: Bot de Predicciones)"
            icon="i-lucide-tag"
            size="lg"
            class="w-full"
          />

          <div class="flex gap-2 justify-end">
            <UButton color="neutral" variant="ghost" class="rounded-full" @click="showGenerateModal = false">
              Cancelar
            </UButton>
            <UButton
              icon="i-lucide-key"
              color="primary"
              class="rounded-full"
              :loading="generatingKey"
              @click="generateKey"
            >
              {{ apiKey ? 'Regenerar' : 'Generar' }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
