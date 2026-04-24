// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Ignore compiled Cloud Functions output — only lint TypeScript sources
  { ignores: ['functions/lib/**'] }
)
