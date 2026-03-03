import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  legacyExports: true,
  dist: 'dist',
  tsconfig: 'tsconfig.json',
  extract: {
    rules: {
      'ae-missing-release-tag': 'off',
    },
  },
})
