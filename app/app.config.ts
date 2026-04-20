export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'rounded-xl font-bold transition-transform active:scale-[0.98]'
      },
      defaultVariants: {
        size: 'lg'
      }
    },
    card: {
      slots: {
        root: 'rounded-3xl border border-(--ui-border) shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)] bg-(--ui-bg-elevated)'
      }
    },
    input: {
      slots: {
        root: 'rounded-xl'
      },
      defaultVariants: {
        size: 'lg'
      }
    },
    badge: {
      slots: {
        base: 'rounded-md font-bold uppercase tracking-wide'
      }
    }
  }
})
