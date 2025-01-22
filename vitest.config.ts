import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.utils.test.ts', '**/e2e/**'],
  },
})
