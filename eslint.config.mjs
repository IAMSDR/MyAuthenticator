// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    "vue/multi-word-component-names": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "vue/require-prop-types": "off",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
  },
})
