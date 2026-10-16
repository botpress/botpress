import { configDefaults, defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.utils.test.ts', '**/e2e/**'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@botpress/sdk': path.resolve(__dirname, 'src/__mocks__/@botpress/sdk.ts'),
      '.botpress': path.resolve(__dirname, 'src/__mocks__/.botpress.ts'),
    },
  },
})
