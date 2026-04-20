<script setup lang="ts">
import type { GroupWithBoardStatus } from '~/types'

interface Props {
  group: GroupWithBoardStatus
  loading?: boolean
  ranking?: number // Support for group-specific ranking
}

defineProps<Props>()
const emit = defineEmits<{
  requestBoard: [groupId: string]
}>()
</script>

<template>
  <div
    class="card-elevated p-5 group active:scale-[0.99] transition-all relative overflow-hidden"
  >
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <!-- Group Icon/Initials -->
        <div
          class="w-12 h-12 rounded-2xl gradient-tricolor flex items-center justify-center font-heading text-white font-bold text-xl shadow-lg shadow-secondary-500/20"
        >
          {{ group.name.substring(0, 2).toUpperCase() }}
        </div>
        <div>
          <h4
            class="font-bold text-neutral-800 dark:text-white leading-tight text-base"
          >
            {{ group.name }}
          </h4>
          <div class="flex items-center gap-1.5 mt-1">
            <span
              class="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-widest"
            >{{ group.code }}</span>
          </div>
        </div>
      </div>

      <!-- Group Specific Ranking Badge -->
      <div
        v-if="group.userBoardIsActive"
        class="bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 px-3 py-1.5 rounded-full text-xs font-black shadow-sm"
      >
        #{{ ranking || "—" }}
      </div>
    </div>

    <!-- Status Badge -->
    <div
      v-if="group.userBoardIsPending"
      class="mb-4"
    >
      <UBadge
        color="neutral"
        variant="soft"
        size="xs"
        class="rounded-full px-2"
      >
        <UIcon
          name="i-lucide-clock"
          class="mr-1"
        />
        Participación Pendiente
      </UBadge>
    </div>

    <div class="flex gap-2">
      <UButton
        v-if="group.userBoardIsActive"
        :to="`/board/${group.userBoardId}`"
        color="secondary"
        variant="soft"
        block
        size="lg"
        class="rounded-xl font-bold uppercase text-[11px] flex-1 bg-secondary-50 hover:bg-secondary-100 dark:bg-secondary-900/20"
        icon="i-lucide-clipboard-list"
      >
        Mi Tabla
      </UButton>
      <UButton
        v-else-if="group.userBoardIsPending"
        color="neutral"
        variant="ghost"
        block
        size="lg"
        class="rounded-xl font-bold uppercase text-[11px] flex-1 opacity-50"
        disabled
        icon="i-lucide-clock"
      >
        Esperando...
      </UButton>
      <UButton
        v-else
        color="primary"
        variant="solid"
        block
        size="lg"
        :loading="loading"
        class="rounded-xl font-bold uppercase text-[11px] flex-1 shadow-lg shadow-primary-500/20"
        icon="i-lucide-circle-plus"
        @click="emit('requestBoard', group.id)"
      >
        Pedir Tabla
      </UButton>

      <UButton
        v-if="group.userBoardIsActive"
        :to="`/groups/${group.id}/positions`"
        color="neutral"
        variant="soft"
        icon="i-lucide-trophy"
        class="rounded-xl"
      />
    </div>
  </div>
</template>
