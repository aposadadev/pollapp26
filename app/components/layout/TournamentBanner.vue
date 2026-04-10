<script setup lang="ts">
interface Props {
  bannerLight?: string
  bannerDark?: string
  title?: string
  subtitle?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 'h-40'
})

const colorMode = useColorMode()
const bannerSrc = computed(() =>
  colorMode.value === 'dark' ? props.bannerDark : props.bannerLight
)
const hasBanner = computed(() => !!bannerSrc.value)
</script>

<template>
  <div
    class="relative w-full overflow-hidden"
    :class="height"
  >
    <!-- Imagen del torneo (si existe) -->
    <img
      v-if="hasBanner"
      :src="bannerSrc"
      :alt="title"
      class="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
    >

    <!-- Placeholder gradient tri-color cuando no hay imagen -->
    <div
      v-else
      class="absolute inset-0 gradient-tricolor"
    />

    <!-- Overlay para texto -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

    <!-- Contenido sobre el banner -->
    <div class="absolute bottom-0 inset-x-0 p-4">
      <slot>
        <p
          v-if="subtitle"
          class="text-white/70 text-xs mb-0.5"
        >
          {{ subtitle }}
        </p>
        <h2
          v-if="title"
          class="text-white font-heading font-bold text-lg leading-tight uppercase tracking-wide"
        >
          {{ title }}
        </h2>
      </slot>
    </div>
  </div>
</template>
