<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { login, loading } = useAuth()

const form = reactive({ email: '', password: '' })
const showPassword = ref(false)

async function handleSubmit() {
  await login(form.email, form.password)
}
</script>

<template>
  <div class="page-content bg-(--ui-bg) min-h-screen relative font-sans">
    <!-- Hero / Branding Massive Gradient -->
    <div
      class="relative w-full pb-[100px] rounded-b-[48px] bg-gradient-to-b from-[#0a1028] to-[#1b2b66] dark:from-[#050815] dark:to-[#0f172a] px-6 pt-16 flex flex-col items-center"
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
          >
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@correo.com"
              icon="i-lucide-mail"
              autocomplete="email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Contraseña"
            name="password"
          >
            <UInput
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-lucide-lock"
              autocomplete="current-password"
              class="w-full"
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
