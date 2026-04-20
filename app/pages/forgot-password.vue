<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { sendPasswordReset, loading } = useAuth()

const email = ref('')
const sent = ref(false)

async function handleSubmit() {
  const ok = await sendPasswordReset(email.value.trim())
  if (ok) sent.value = true
}
</script>

<template>
  <div class="bg-(--ui-bg) min-h-screen relative font-sans">
    <!-- Hero / Branding Massive Gradient -->
    <div
      class="relative w-full pb-[100px] rounded-b-[48px] bg-gradient-to-b from-[#0a1028] to-[#1b2b66] dark:from-[#050815] dark:to-[#0f172a] px-6 pt-16 flex flex-col items-center"
    >
      <div
        class="size-16 rounded-[20px] bg-white/10 ring-1 ring-white/20 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md stagger-up"
      >
        <UIcon
          name="i-lucide-key-round"
          class="size-8 text-secondary-500"
        />
      </div>

      <h1
        class="text-white text-[32px] md:text-5xl font-black font-heading leading-tight drop-shadow-md text-center tracking-tight stagger-up stagger-d1"
      >
        RECUPERAR CLAVE
      </h1>
      <p
        class="text-secondary-400 text-[11px] font-bold tracking-[0.2em] font-heading uppercase mt-3 opacity-90 drop-shadow-sm stagger-up stagger-d2"
      >
        {{ mundial2026.shortName }}
      </p>
    </div>

    <!-- Contenido Overlapping -->
    <div
      class="relative z-10 -mt-16 px-4 sm:px-6 w-full max-w-sm mx-auto pb-32"
    >
      <div
        class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[32px] p-6 sm:p-8 stagger-up stagger-d3"
      >
        <!-- Enviado -->
        <div
          v-if="sent"
          class="text-center space-y-4 pt-4 pb-2"
        >
          <div
            class="size-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto text-primary-600 dark:text-primary-400"
          >
            <UIcon
              name="i-lucide-mail-check"
              class="size-8"
            />
          </div>
          <div>
            <h2 class="text-xl font-bold font-heading uppercase tracking-wide">
              Correo enviado
            </h2>
            <p
              class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-2"
            >
              Enviamos un enlace de recuperación a
              <strong class="text-neutral-800 dark:text-white">{{
                email
              }}</strong>. Revisa tu bandeja de entrada y la carpeta de spam.
            </p>
          </div>
          <UButton
            to="/login"
            color="primary"
            class="w-full h-12 rounded-[20px] font-bold tracking-widest uppercase mt-6 justify-center"
            icon="i-lucide-arrow-left"
          >
            Volver al inicio
          </UButton>
        </div>

        <!-- Formulario -->
        <template v-else>
          <div class="mb-6 text-center">
            <p
              class="text-sm font-medium text-neutral-500 dark:text-neutral-400"
            >
              Te enviaremos un correo para restablecer tu contraseña.
            </p>
          </div>

          <UForm
            :state="{ email }"
            class="space-y-5"
            @submit="handleSubmit"
          >
            <UFormField
              label="Correo electrónico"
              name="email"
            >
              <UInput
                v-model="email"
                type="email"
                placeholder="tu@correo.com"
                icon="i-lucide-mail"
                autocomplete="email"
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              color="primary"
              class="w-full h-12 rounded-[20px] font-black tracking-widest uppercase mt-4"
              :loading="loading"
              icon="i-lucide-send"
            >
              Enviar enlace
            </UButton>
          </UForm>

          <div class="text-center mt-8">
            <NuxtLink
              to="/login"
              class="text-[13px] font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
            >
              ← Volver al inicio de sesión
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
