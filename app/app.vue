<script setup lang="ts">
import { mundial2026 } from '~/config/tournaments/mundial2026'
import { tournamentThemeService } from '~/services/tournament-theme.service'

// ── SEO ──────────────────────────────────────────────────────────────────────
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap'
    },
    { rel: 'icon', href: mundial2026.assets.favicon }
  ],
  htmlAttrs: {
    lang: 'es'
  }
})

useSeoMeta({
  title: mundial2026.name,
  description: `Quiniela del ${mundial2026.name} — ${mundial2026.hosts.join(', ')} ${mundial2026.season}`,
  ogTitle: mundial2026.name,
  ogDescription: `Predice los marcadores y compite con tus amigos en la quiniela del ${mundial2026.name}.`,
  twitterCard: 'summary_large_image'
})

// ── Theme ─────────────────────────────────────────────────────────────────────
// Inyecta los colores del torneo como CSS custom properties en <html>
onMounted(() => {
  tournamentThemeService.apply(mundial2026)
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UToaster />
  </UApp>
</template>
