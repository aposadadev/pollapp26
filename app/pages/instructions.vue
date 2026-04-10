<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const appStore = useAppStore()
onMounted(() => appStore.setPageTitle('Reglamento'))

const pointsRules = [
  {
    points: 3,
    label: 'Marcador exacto',
    description: 'Predijiste 2-1 y el resultado fue 2-1',
    emoji: '🎯'
  },
  {
    points: 1,
    label: 'Resultado correcto',
    description: 'Predijiste victoria pero el marcador fue distinto',
    emoji: '✅'
  }
]

const faqs = [
  {
    q: '¿Puedo cambiar mi pronóstico?',
    a: 'Sí, puedes modificar tu pronóstico en cualquier momento antes de que comience el partido. Una vez iniciado, se bloquea automáticamente.'
  },
  {
    q: '¿Puedo estar en varios grupos?',
    a: '¡Sí! Puedes unirte a tantos grupos como quieras y participar en múltiples tablas dentro de cada grupo.'
  },
  {
    q: '¿Qué pasa si no pongo pronóstico?',
    a: 'Si no ingresas un pronóstico antes del inicio del partido, recibirás 0 puntos por ese partido.'
  },
  {
    q: '¿Cómo se desempata?',
    a: 'En caso de empate en puntos, gana quien tenga más marcadores exactos. Si persiste, gana quien tenga más resultados correctos.'
  }
]
</script>

<template>
  <div class="page-content bg-(--ui-bg) min-h-screen relative font-sans">
    <LayoutPageHeader
      title="REGLAMENTO"
      subtitle="GUÍA VISUAL 2026"
    />

    <div class="relative z-10 -mt-20 px-4 sm:px-6 flex flex-col gap-10 pb-32">
      <!-- Rules Gallery (The main visual guide) -->
      <div class="stagger-up stagger-d1">
        <UiRulesGallery />
      </div>

      <!-- Quick Summary of Points -->
      <div class="flex flex-col gap-4 stagger-up stagger-d2">
        <h3 class="text-[14px] font-black text-neutral-500 dark:text-neutral-400 tracking-widest font-heading px-2">
          RESUMEN DE PUNTOS
        </h3>

        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="rule in pointsRules"
            :key="rule.points"
            class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-[24px] p-4 shadow-sm flex flex-col items-center text-center gap-2"
          >
            <span class="text-3xl">{{ rule.emoji }}</span>
            <div class="font-heading font-black text-xl text-secondary-600 dark:text-secondary-400">
              +{{ rule.points }} PTS
            </div>
            <p class="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              {{ rule.label }}
            </p>
          </div>
        </div>
      </div>

      <!-- Important Notices -->
      <div class="stagger-up stagger-d3">
        <div class="bg-secondary-600 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-4">
              <UIcon
                name="i-lucide-info"
                class="size-6 text-secondary-200"
              />
              <h3 class="text-lg font-black font-heading uppercase tracking-widest">
                A tener en cuenta
              </h3>
            </div>
            <ul class="space-y-4 text-sm font-medium text-secondary-50/90">
              <li class="flex gap-3 items-start">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="size-5 shrink-0 text-secondary-300"
                />
                <span>Las predicciones se bloquean exactamente al pitazo inicial de cada partido.</span>
              </li>
              <li class="flex gap-3 items-start">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="size-5 shrink-0 text-secondary-300"
                />
                <span>Las tablas de posiciones se actualizan en tiempo real (Live Table).</span>
              </li>
              <li class="flex gap-3 items-start">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="size-5 shrink-0 text-secondary-300"
                />
                <span>Puedes tener estrategias distintas en cada una de tus tablas.</span>
              </li>
            </ul>
          </div>
          <!-- Decorative Background Icon -->
          <UIcon
            name="i-lucide-shield-check"
            class="absolute -right-4 -bottom-4 size-32 text-white/10 rotate-12 transition-transform group-hover:scale-110"
          />
        </div>
      </div>

      <!-- FAQs -->
      <div class="stagger-up stagger-d4">
        <h3 class="text-[14px] font-black text-neutral-500 dark:text-neutral-400 tracking-widest font-heading px-2 mb-4">
          PREGUNTAS FRECUENTES
        </h3>
        <div class="bg-(--ui-bg-elevated) border border-(--ui-border) rounded-[24px] overflow-hidden">
          <UAccordion
            :items="faqs.map((faq, i) => ({
              label: faq.q,
              slot: `faq-${i}`,
              icon: 'i-lucide-chevron-down'
            }))"
          >
            <template #item="{ item }">
              <p class="text-[13.5px] font-medium text-neutral-500 dark:text-neutral-400 px-5 pb-5 leading-relaxed">
                {{ faqs.find((f) => f.q === item.label)?.a }}
              </p>
            </template>
          </UAccordion>
        </div>
      </div>

      <!-- Action Button -->
      <div class="stagger-up stagger-d5 pt-4">
        <UButton
          to="/"
          class="w-full justify-center h-16 rounded-[24px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-none hover:bg-black dark:hover:bg-neutral-100 font-black font-heading tracking-[0.2em] uppercase transition-all active:scale-[0.97] shadow-lg"
        >
          ¡ENTENDIDO! IR AL INICIO
        </UButton>
      </div>
    </div>
  </div>
</template>
