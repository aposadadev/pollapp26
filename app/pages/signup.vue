<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { register, loading } = useAuth()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const passwordError = ref('')

function validatePasswords() {
  if (form.password !== form.confirmPassword) {
    passwordError.value = 'Las contraseñas no coinciden.'
    return false
  }
  if (form.password.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres.'
    return false
  }
  passwordError.value = ''
  return true
}

async function handleSubmit() {
  if (!validatePasswords()) return
  await register(form.email, form.password, form.firstName, form.lastName)
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
          name="i-lucide-user-plus"
          class="size-8 text-secondary-500"
        />
      </div>

      <h1
        class="text-white text-[32px] md:text-5xl font-black font-heading leading-tight drop-shadow-md text-center tracking-tight stagger-up stagger-d1"
      >
        ÚNETE AHORA
      </h1>
      <p
        class="text-secondary-400 text-[11px] font-bold tracking-[0.2em] font-heading uppercase mt-3 opacity-90 drop-shadow-sm stagger-up stagger-d2"
      >
        MUNDO FOOTBALL 2026
      </p>
    </div>

    <!-- Formulario Overlapping -->
    <div
      class="relative z-10 -mt-16 px-4 sm:px-6 w-full max-w-sm mx-auto pb-32"
    >
      <div
        class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[32px] p-6 sm:p-8 stagger-up stagger-d3"
      >
        <UForm
          :state="form"
          class="space-y-4"
          @submit="handleSubmit"
        >
          <!-- Nombre + Apellido -->
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Nombre"
              name="firstName"
            >
              <UInput
                v-model="form.firstName"
                placeholder="Juan"
                icon="i-lucide-user"
                autocomplete="given-name"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Apellido"
              name="lastName"
            >
              <UInput
                v-model="form.lastName"
                placeholder="García"
                autocomplete="family-name"
                class="w-full"
              />
            </UFormField>
          </div>

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
              placeholder="Mínimo 6 caracteres"
              icon="i-lucide-lock"
              autocomplete="new-password"
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

          <UFormField
            label="Confirmar"
            name="confirmPassword"
            :error="passwordError"
          >
            <UInput
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Repite tu contraseña"
              icon="i-lucide-lock-keyhole"
              autocomplete="new-password"
              class="w-full"
              :color="passwordError ? 'error' : undefined"
            />
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            class="w-full h-12 rounded-[20px] font-black tracking-widest uppercase mt-6"
            :loading="loading"
            icon="i-lucide-user-plus"
          >
            Crear cuenta
          </UButton>
        </UForm>

        <div class="text-center mt-8">
          <NuxtLink
            to="/login"
            class="text-[13px] font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
          >
            ¿Ya tienes cuenta? Iniciar sesión
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
