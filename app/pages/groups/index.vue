<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const groupsComposable = useGroups(appStore.activeTournamentId)

const boards = groupsComposable.groups // boards are returned by groups reactive ref in useGroups
const loading = groupsComposable.loading
const loadGroups = groupsComposable.loadGroups

const TOURNAMENT_ID = appStore.activeTournamentId
const requestingBoard = ref(false)

onMounted(async () => {
  appStore.setPageTitle('Mis Tablas')
  await loadGroups()
})

async function handleRequestBoard() {
  if (boards.value.length >= 3) return
  requestingBoard.value = true
  await groupsComposable.requestBoard('global-group', TOURNAMENT_ID)
  requestingBoard.value = false
  await loadGroups()
}
</script>

<template>
  <div class="font-sans">
    <!-- Header con gradiente -->
    <LayoutPageHeader
      title="Mis Tablas"
      subtitle="Administra tus tablas para la polla del mundial"
    />

    <div class="p-4 space-y-6 pb-24">
      <!-- Card Informativa del Límite de Tablas -->
      <div class="stagger-up stagger-d1">
        <div class="bg-(--ui-bg-elevated) shadow-[0_12px_30px_rgba(27,43,102,0.08)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)] border border-(--ui-border) rounded-[24px] p-5 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-black tracking-[0.2em] font-heading text-neutral-400 uppercase">
              Límite de Tablas
            </span>
            <span class="text-xs font-bold text-secondary-600 dark:text-secondary-400 bg-secondary-500/10 dark:bg-secondary-400/15 px-2.5 py-1 rounded-full font-mono">
              {{ boards.length }} / 3
            </span>
          </div>

          <div class="space-y-1.5">
            <p class="text-sm font-bold text-(--ui-text-highlighted)">
              Juega con hasta 3 tablas independientes
            </p>
            <p class="text-xs text-(--ui-text-muted) leading-relaxed">
              Cada tabla te permite realizar tus propias predicciones y competir en el ranking global.
              Puedes solicitar una tabla a la vez o todas juntas. Las tablas requieren aprobación del administrador antes de poder predecir o puntuar.
            </p>
          </div>

          <!-- Barra de progreso -->
          <div class="w-full bg-(--ui-bg-muted) rounded-full h-2 overflow-hidden">
            <div
              class="bg-secondary-500 h-full transition-all duration-500 rounded-full"
              :style="{ width: `${(boards.length / 3) * 100}%` }"
            />
          </div>

          <!-- Botón de Solicitud -->
          <UButton
            v-if="boards.length < 3"
            color="primary"
            variant="solid"
            icon="i-lucide-plus-circle"
            class="w-full font-heading font-black uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-primary-600/15 text-xs active:scale-[0.99] transition-transform"
            :loading="requestingBoard"
            @click="handleRequestBoard"
          >
            Solicitar Nueva Tabla
          </UButton>
          <div
            v-else
            class="flex items-center justify-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-(--ui-border) text-neutral-400 dark:text-neutral-500 text-xs font-bold uppercase tracking-wider text-center"
          >
            <UIcon name="i-lucide-check-circle-2" class="size-4 text-emerald-500" />
            Límite de tablas alcanzado
          </div>
        </div>
      </div>

      <!-- Listado de mis tablas -->
      <div class="stagger-up stagger-d2 space-y-4">
        <h3 class="font-heading text-[13px] font-black text-neutral-500 dark:text-neutral-400 tracking-wider uppercase px-1">
          Tus Tablas Solicitadas
        </h3>

        <div
          v-if="loading"
          class="space-y-3"
        >
          <USkeleton
            v-for="i in 2"
            :key="i"
            class="h-28 rounded-[24px]"
          />
        </div>

        <div
          v-else-if="boards.length"
          class="grid gap-4"
        >
          <div
            v-for="(board, idx) in boards"
            :key="board.id"
            class="card-elevated overflow-hidden transition-all duration-200 hover:shadow-md stagger-up"
            :class="[
              board.isActive
                ? 'border-l-4 border-l-secondary-500 hover:-translate-y-0.5'
                : 'opacity-85 border-l-4 border-l-neutral-300 dark:border-l-neutral-700'
            ]"
          >
            <div class="p-5 flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2.5">
                  <h4 class="font-heading font-black text-base text-(--ui-text-highlighted) uppercase tracking-wide">
                    Tabla {{ idx + 1 }}
                  </h4>
                  <UBadge
                    v-if="board.isActive"
                    color="secondary"
                    variant="soft"
                    size="xs"
                    class="rounded-md font-bold uppercase tracking-wider text-[9px]"
                  >
                    Activa
                  </UBadge>
                  <UBadge
                    v-else
                    color="neutral"
                    variant="soft"
                    size="xs"
                    class="rounded-md font-bold uppercase tracking-wider text-[9px]"
                  >
                    Pendiente
                  </UBadge>
                </div>

                <div class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                  <span class="font-mono text-(--ui-text-muted) uppercase">
                    Número: #{{ board.number }}
                  </span>
                  <span
                    v-if="board.isActive"
                    class="font-semibold text-secondary-600 dark:text-secondary-400 flex items-center gap-1"
                  >
                    <UIcon name="i-lucide-award" class="size-3.5" />
                    Puntaje: {{ board.totalPoints || 0 }} pts
                  </span>
                </div>
              </div>

              <!-- Icono decorativo -->
              <div
                class="size-10 rounded-xl flex items-center justify-center shrink-0"
                :class="[
                  board.isActive
                    ? 'bg-secondary-500/10 text-secondary-600 dark:text-secondary-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'
                ]"
              >
                <UIcon
                  :name="board.isActive ? 'i-lucide-trophy' : 'i-lucide-clock'"
                  class="size-5"
                />
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="px-5 pb-4 pt-3 flex gap-2 border-t border-(--ui-border)/40 bg-neutral-50/50 dark:bg-neutral-800/15">
              <UButton
                v-if="board.isActive"
                :to="`/board/${board.id}`"
                color="primary"
                variant="solid"
                size="sm"
                class="flex-1 font-heading font-black text-xs uppercase tracking-wider rounded-xl py-2.5 shadow-sm shadow-primary-600/10"
                icon="i-lucide-clipboard-list"
              >
                Mis Predicciones
              </UButton>
              <div
                v-else
                class="w-full flex items-center justify-center gap-2 py-2 px-3 bg-neutral-100/50 dark:bg-neutral-800/40 rounded-xl text-neutral-500 text-xs font-semibold text-center border border-dashed border-(--ui-border)"
              >
                <UIcon name="i-lucide-lock" class="size-3.5 animate-pulse" />
                Esperando activación por el administrador
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="card-elevated text-center py-12 stagger-up"
        >
          <div class="size-16 bg-(--ui-bg-muted) rounded-full flex items-center justify-center mx-auto mb-4 border border-(--ui-border)">
            <UIcon
              name="i-lucide-clipboard-list"
              class="size-8 text-(--ui-text-muted)"
            />
          </div>
          <p class="font-heading text-lg font-bold text-(--ui-text-highlighted) uppercase tracking-wide">
            Sin Tablas
          </p>
          <p class="text-sm text-(--ui-text-muted) max-w-xs mx-auto mt-1">
            Aún no has solicitado ninguna tabla para el torneo. Solicita tu primera tabla arriba para empezar a jugar.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
