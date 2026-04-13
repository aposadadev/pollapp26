<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'

definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const groupContextStore = useGroupContextStore()
const groupsComposable = useGroups(mundial2026.id)

const groups = groupsComposable.groups
const loading = groupsComposable.loading
const loadGroups = groupsComposable.loadGroups

const requestingBoardId = ref<string | null>(null)

onMounted(async () => {
  appStore.setPageTitle('Dashboard')
  await loadGroups()

  // Auto-set context if not set but user has an active group
  if (!groupContextStore.hasContext && groups.value.length) {
    const activeGroup = groups.value.find(g => g.userBoardIsActive)
    if (activeGroup?.userBoardId) {
      groupContextStore.setContext({
        groupId: activeGroup.id,
        groupName: activeGroup.name,
        groupCode: activeGroup.code,
        boardId: activeGroup.userBoardId
      })
    }
  }
})

// Usa el contexto activo — si no, cae al primer board activo
const firstActiveBoardId = computed(
  () =>
    groupContextStore.activeBoardId
    ?? groups.value.find(g => g.userBoardIsActive)?.userBoardId
    ?? null
)

async function handleRequestBoard(_groupId: string) {
  /* ... existing logic ... */
}
</script>

<template>
  <div class="page-content bg-(--ui-bg) min-h-screen relative font-sans">
    <!-- Hero Header (Theme WC26) -->
    <div
      class="relative w-full h-[300px] rounded-b-[48px] overflow-hidden bg-gradient-to-b from-[#0a1028] to-[#1b2b66] dark:from-[#050815] dark:to-[#0f172a] px-6 pt-6"
    >
      <!-- Top nav row inside hero -->
      <div class="flex items-center justify-between pt-safe-top mt-2">
        <span
          class="text-white/90 text-xs font-black tracking-[0.2em] font-heading"
        >FIFA WORLD CUP 2026™</span>
        <button
          class="p-2 -mr-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <UIcon
            name="i-lucide-bell"
            class="size-5"
          />
        </button>
      </div>

      <!-- User Stat / Hero Points -->
      <div
        class="flex flex-col items-center justify-center mt-12 gap-1 stagger-up"
      >
        <span
          class="text-white text-[56px] font-black font-heading leading-none drop-shadow-md tracking-tight"
        >
          2,450
        </span>
        <span
          class="text-secondary-400 text-[11px] font-bold tracking-widest mt-1 opacity-90 drop-shadow-sm"
        >
          PUNTOS GLOBALES • RANGO #14
        </span>
      </div>
    </div>

    <!-- Main Stack -->
    <div class="relative z-10 -mt-20 px-4 sm:px-6 flex flex-col gap-8 pb-32">
      <!-- Feature: Next Match Block (Overlapping) -->
      <div class="stagger-up stagger-d2">
        <div
          class="bg-(--ui-bg-elevated) shadow-[0_20px_40px_rgba(27,43,102,0.15)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-(--ui-border) rounded-[28px] p-6 lg:p-8 relative overflow-hidden group active:scale-[0.99] transition-all"
        >
          <div class="flex flex-col gap-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
              <span
                class="text-error-600 text-[13px] font-black font-heading tracking-wide"
              >HOY • 16:00</span>
              <span
                class="text-neutral-500 dark:text-neutral-400 text-[12px] font-bold tracking-widest"
              >GRUPO C</span>
            </div>

            <!-- Teams -->
            <div class="flex justify-between items-center px-4">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-(--ui-bg-elevated) shadow-sm overflow-hidden flex items-center justify-center"
                >
                  <span class="text-[40px] text-center leading-none mt-1">🇲🇽</span>
                </div>
                <span
                  class="text-2xl font-black font-heading text-neutral-800 dark:text-white leading-none"
                >MEX</span>
              </div>

              <span
                class="text-neutral-300 dark:text-neutral-600 text-[18px] font-black font-heading"
              >VS</span>

              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-(--ui-bg-elevated) shadow-sm overflow-hidden flex items-center justify-center"
                >
                  <span class="text-[40px] text-center leading-none mt-1">🇺🇸</span>
                </div>
                <span
                  class="text-2xl font-black font-heading text-neutral-800 dark:text-white leading-none"
                >USA</span>
              </div>
            </div>

            <!-- Action -->
            <UButton
              v-if="firstActiveBoardId"
              :to="`/board/${firstActiveBoardId}`"
              class="w-full bg-gradient-to-r from-error-600 to-error-800 hover:from-error-500 hover:to-error-700 h-14 rounded-[20px] text-white text-[14px] font-black tracking-wide font-heading shadow-lg shadow-error-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              HAZ TU PRONÓSTICO
            </UButton>
            <div
              v-else
              class="w-full bg-neutral-100 dark:bg-neutral-800 h-14 rounded-[20px] text-neutral-400 text-[14px] font-black tracking-wide font-heading flex items-center justify-center"
            >
              SIN TABLA ACTIVA
            </div>
          </div>
        </div>
      </div>

      <!-- Tus Ligas -->
      <div class="flex flex-col gap-4 stagger-up stagger-d4">
        <div class="flex items-center justify-between px-2">
          <h3
            class="text-[14px] font-black text-neutral-500 dark:text-neutral-400 tracking-widest font-heading"
          >
            TUS LIGAS
          </h3>
          <button
            class="text-[13px] font-bold text-primary-500 hover:text-primary-600 transition-colors"
          >
            Ver todas
          </button>
        </div>

        <!-- Horizontal Scroll Snap Container -->
        <div
          class="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide"
        >
          <div
            v-if="loading"
            class="flex gap-4"
          >
            <USkeleton
              v-for="i in 2"
              :key="i"
              class="w-[160px] h-[160px] rounded-[20px] shrink-0"
            />
          </div>

          <template v-else-if="groups.length">
            <div
              v-for="(group, i) in groups"
              :key="group.id"
              class="shrink-0 w-[160px] bg-(--ui-bg-elevated) border border-(--ui-border) p-5 rounded-[20px] snap-center flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:shadow-md transition-shadow"
            >
              <div class="flex items-center gap-2 mb-4">
                <!-- Alternating Icons based on index for illustration, in real app based on group setting -->
                <UIcon
                  :name="i % 2 === 0 ? 'i-lucide-users' : 'i-lucide-briefcase'"
                  class="size-5 text-neutral-500"
                />
                <span
                  class="text-[13px] font-bold text-neutral-800 dark:text-white truncate"
                >{{ group.name }}</span>
              </div>

              <div class="flex-1" />

              <div class="flex flex-col gap-1 mb-4">
                <span class="text-[11px] text-neutral-400 font-medium">Posición:</span>
                <!-- Mock ranking formatting logic -->
                <span
                  class="text-[13px] font-black"
                  :class="
                    i === 0
                      ? 'text-secondary-500'
                      : 'text-neutral-600 dark:text-neutral-300'
                  "
                >#{{ i + 1 }} de {{ (i + 1) * 5 }}</span>
              </div>

              <UButton
                v-if="group.userBoardIsActive"
                :to="`/board/${group.userBoardId}`"
                variant="soft"
                color="neutral"
                block
                size="xs"
                class="rounded-lg font-bold"
              >
                Ingresar
              </UButton>
              <UButton
                v-else
                variant="soft"
                color="primary"
                block
                size="xs"
                class="rounded-lg font-bold"
                :loading="requestingBoardId === group.id"
                @click="handleRequestBoard(group.id)"
              >
                Activar
              </UButton>
            </div>
          </template>

          <!-- Empty State -->
          <div
            v-else
            class="w-full flex items-center justify-center p-8 bg-(--ui-bg-elevated) rounded-[20px] border border-(--ui-border) border-dashed"
          >
            <span class="text-sm font-bold text-neutral-400">Sin ligas activas</span>
          </div>
        </div>
      </div>

      <!-- Resultados Recientes -->
      <div class="flex flex-col gap-4 stagger-up stagger-d5 px-2">
        <h3
          class="text-[12px] font-black text-neutral-500 dark:text-neutral-400 tracking-wider font-heading"
        >
          RESULTADOS RECIENTES
        </h3>

        <div
          class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-[16px] p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.99] cursor-pointer hover:border-(--ui-primary)/30"
        >
          <span
            class="font-heading font-black text-neutral-800 dark:text-white text-lg tracking-wide"
          >
            ARG
            <span class="mx-1.5 text-neutral-300 font-normal">2 - 1</span> ESP
          </span>
          <div
            class="bg-secondary-500/10 dark:bg-secondary-400/10 text-secondary-600 dark:text-secondary-400 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider"
          >
            +3 PTS
          </div>
        </div>

        <div
          class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-[16px] p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.99] cursor-pointer hover:border-(--ui-primary)/30"
        >
          <span
            class="font-heading font-black text-neutral-800 dark:text-white text-lg tracking-wide"
          >
            FRA
            <span class="mx-1.5 text-neutral-300 font-normal">0 - 0</span> URU
          </span>
          <div
            class="bg-primary-500/10 dark:bg-primary-400/10 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wider"
          >
            +1 PT
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
