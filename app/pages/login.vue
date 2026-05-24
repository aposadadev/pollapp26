<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { login, loginWithGoogle, loading } = useAuth()

const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')

// Reactive real-time validation to clear errors as the user types
watch(() => form.email, (val) => {
  if (val.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    emailError.value = ''
  }
})

watch(() => form.password, (val) => {
  if (val.trim()) {
    passwordError.value = ''
  }
})

function validateForm() {
  let isValid = true

  // Validar correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    emailError.value = 'El correo electrónico es requerido.'
    isValid = false
  } else if (!emailRegex.test(form.email.trim())) {
    emailError.value = 'El formato del correo electrónico no es válido.'
    isValid = false
  } else {
    emailError.value = ''
  }

  // Validar contraseña
  if (!form.password) {
    passwordError.value = 'La contraseña es requerida.'
    isValid = false
  } else {
    passwordError.value = ''
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) return
  await login(form.email, form.password)
}

async function handleGoogleLogin() {
  await loginWithGoogle()
}
</script>

<template>
  <div class="bg-(--ui-bg) min-h-screen relative font-sans">
    <!-- Hero / Branding Massive Gradient -->
    <div
      class="relative w-full pb-[100px] rounded-b-[48px] bg-gradient-to-b from-primary-900 to-primary-700 dark:from-primary-950 dark:to-primary-900 px-6 pt-16 flex flex-col items-center"
    >
      <div
        class="size-16 rounded-[20px] bg-white/10 ring-1 ring-white/20 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md stagger-up"
      >
        <UIcon
          name="i-lucide-trophy"
          class="size-8 text-secondary-500"
        />
      </div>

      <h1
        class="text-white text-[32px] md:text-5xl font-black font-heading leading-tight drop-shadow-md text-center tracking-tight stagger-up stagger-d1"
      >
        {{ mundial2026.shortName }}
      </h1>
      <p
        class="text-secondary-400 text-[11px] font-bold tracking-[0.2em] font-heading uppercase mt-3 opacity-90 drop-shadow-sm stagger-up stagger-d2"
      >
        {{ mundial2026.hosts.join(" · ") }}
      </p>
    </div>

    <!-- Formulario Overlapping -->
    <div
      class="relative z-10 -mt-16 px-4 sm:px-6 w-full max-w-sm mx-auto pb-32"
    >
      <div
        class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[32px] p-6 sm:p-8 stagger-up stagger-d3"
      >
        <div class="mb-8 text-center">
          <span
            class="text-[12px] font-black tracking-[0.1em] font-heading text-neutral-500 dark:text-neutral-400 uppercase"
          >INICIAR SESIÓN</span>
          <p class="text-sm font-medium text-neutral-400 mt-1">
            Ingresa a tu quiniela mundialista
          </p>
        </div>

        <UForm
          :state="form"
          class="space-y-5"
          @submit="handleSubmit"
        >
          <UFormField
            label="Correo electrónico"
            name="email"
            :error="emailError || undefined"
          >
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@correo.com"
              icon="i-lucide-mail"
              autocomplete="email"
              class="w-full"
              :color="emailError ? 'error' : undefined"
            />
          </UFormField>

          <UFormField
            label="Contraseña"
            name="password"
            :error="passwordError || undefined"
          >
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-lucide-lock"
              autocomplete="current-password"
              class="w-full"
              :color="passwordError ? 'error' : undefined"
            >
              <template #trailing>
                <UButton
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="ghost"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            class="w-full h-12 rounded-[20px] font-black tracking-widest uppercase mt-4"
            :loading="loading"
            icon="i-lucide-log-in"
          >
            Entrar
          </UButton>
        </UForm>

        <div class="relative flex items-center justify-center my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-(--ui-border)/50" />
          </div>
          <span class="relative bg-(--ui-bg-elevated) px-3 text-xs text-(--ui-text-muted) uppercase font-semibold tracking-wider">
            o entra con
          </span>
        </div>

        <UButton
          color="neutral"
          variant="subtle"
          class="w-full h-12 rounded-[20px] font-bold tracking-wide flex items-center justify-center gap-2 border border-(--ui-border)/50 hover:bg-(--ui-bg-muted) transition-colors mb-6"
          icon="i-simple-icons-google"
          :loading="loading"
          @click="handleGoogleLogin"
        >
          Google
        </UButton>

        <div class="flex flex-col gap-4 mt-8 text-center">
          <UButton
            to="/signup"
            variant="soft"
            color="neutral"
            class="w-full justify-center h-12 rounded-[20px] font-bold tracking-widest uppercase"
          >
            Crear cuenta nueva
          </UButton>
          <NuxtLink
            to="/forgot-password"
            class="text-[13px] font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors mt-2"
          >
            ¿Olvidaste tu contraseña?
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
