import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 20_000,
    include: ['./e2e/**/*.test.ts'],
  },
})
