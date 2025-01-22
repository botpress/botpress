import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      '**/*.utils.test.ts',
      'packages/client/tests/manual/**',
      'packages/chat-e2e/**',
      'packages/cognitive/src/__tests__/**',
    ],
  },
})
