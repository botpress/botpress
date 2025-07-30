import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    chaiConfig: {
      truncateThreshold: 1000,
    },
  },
})
