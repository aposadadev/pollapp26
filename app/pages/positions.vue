<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
const authStore = useAuthStore()

onMounted(() => {
  appStore.setPageTitle('Ranking')
})

const selectedGroupId = ref<string>('global-group')
const { entries, loading: loadingPositions, lastUpdated } = usePositions(selectedGroupId)
</script>

<template>
  <BoardPositionsView
    title="RANKING GLOBAL"
    subtitle="CLASIFICACIÓN GENERAL"
    :entries="entries"
    :loading="loadingPositions"
    :last-updated="lastUpdated"
    :current-user-id="authStore.user?.id"
  />
</template>
