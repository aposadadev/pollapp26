<script setup lang="ts">
const items = [
  {
    title: '¡Bienvenido a WC26!',
    description: 'Compite por el honor y demuestra tu conocimiento futbolístico en la polla definitiva del Mundial 2026.',
    image: '/rules/welcome.png',
    accent: 'secondary'
  },
  {
    title: 'Únete a la Acción',
    description: 'Busca una liga por su código o crea la tuya para jugar con amigos y familiares de forma privada.',
    image: '/rules/join.png',
    accent: 'primary'
  },
  {
    title: 'Haz tus Pronósticos',
    description: 'Ingresa tus marcadores antes de cada partido. Recuerda: el límite es el inicio del encuentro.',
    image: '/rules/predict.png',
    accent: 'secondary'
  },
  {
    title: 'El Sistema de Puntos',
    description: 'Gana 3 puntos por marcador exacto y 1 punto por acertar solo el resultado (ganador o empate).',
    image: '/rules/points.png',
    accent: 'primary'
  },
  {
    title: '¡A la Cima del Ránking!',
    description: 'Tu posición se actualiza en tiempo real. ¡Demuestra que eres el que más sabe de fútbol!',
    image: '/rules/rank.png',
    accent: 'secondary'
  }
]
</script>

<template>
  <div class="rules-gallery w-full max-w-lg mx-auto overflow-hidden rounded-[40px] border border-(--ui-border) shadow-2xl bg-(--ui-bg-elevated) group">
    <UCarousel
      v-slot="{ item }"
      :items="items"
      :ui="{
        item: 'basis-full'
      }"
      indicators
      class="w-full"
    >
      <div class="relative w-full aspect-[4/5] sm:aspect-square overflow-hidden flex flex-col">
        <!-- Image Container -->
        <div class="flex-1 relative overflow-hidden">
          <img
            :src="item.image"
            :alt="item.title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          >
          <!-- Gradient Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
        </div>

        <!-- Text Content -->
        <div class="absolute bottom-0 inset-x-0 p-8 pt-12 text-white">
          <h3 class="text-2xl font-black font-heading uppercase tracking-tight leading-none mb-3 drop-shadow-xl">
            {{ item.title }}
          </h3>
          <p class="text-[14px] font-medium text-white/80 leading-relaxed drop-shadow-lg">
            {{ item.description }}
          </p>

          <!-- Badge -->
          <div class="mt-6 flex items-center gap-2">
            <div
              class="size-2 rounded-full animate-pulse"
              :class="item.accent === 'secondary' ? 'bg-secondary-500 shadow-[0_0_10px_rgba(var(--color-secondary-500),0.8)]' : 'bg-primary-500 shadow-[0_0_10px_rgba(var(--color-primary-500),0.8)]'"
            />
            <span class="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">Reglamento Oficial</span>
          </div>
        </div>
      </div>
    </UCarousel>
  </div>
</template>

<style scoped>
.rules-gallery {
  transform: translateZ(0); /* Fix for some overflow/radius glitches */
}
</style>
