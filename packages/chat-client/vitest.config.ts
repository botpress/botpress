import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 20_000, // because LLMs can be slow
    include: ['./e2e/**/*.test.ts'],
  },
})
