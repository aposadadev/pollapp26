<script setup lang="ts">
import { groupRepository } from '~/repositories/group.repository'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()
const groupContextStore = useGroupContextStore()

const groupId = computed(() => route.params.groupId as string)
const { entries, loading, lastUpdated } = usePositions(groupId)

const backTo = computed(() =>
  groupContextStore.activeGroupId === groupId.value && groupContextStore.activeBoardId
    ? `/board/${groupContextStore.activeBoardId}`
    : '/groups'
)

const backLabel = computed(() =>
  groupContextStore.activeGroupId === groupId.value && groupContextStore.activeBoardId
    ? 'Volver a mi tabla'
    : 'Mis ligas'
)

const fetchedGroupName = ref<string | null>(null)

const groupName = computed(
  () =>
    groupContextStore.activeGroupId === groupId.value
      ? groupContextStore.activeGroupName
      : fetchedGroupName.value
)

onMounted(async () => {
  appStore.setPageTitle('Ranking')
  if (groupContextStore.activeGroupId !== groupId.value) {
    try {
      const group = await groupRepository.findById(groupId.value)
      fetchedGroupName.value = group?.name ?? null
    } catch {
      // ignore — subtitle will just show 'CLASIFICACIÓN'
    }
  }
})
</script>

<template>
  <BoardPositionsView
    title="RANKING"
    :subtitle="groupName ?? 'CLASIFICACIÓN'"
    :entries="entries"
    :loading="loading"
    :last-updated="lastUpdated"
    :current-user-id="authStore.user?.id"
    :back-to="backTo"
    :back-label="backLabel"
  />
</template>
