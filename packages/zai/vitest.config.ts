import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    retry: 2, // because LLMs can fail
    testTimeout: 60_000, // because LLMs can be slow
    include: ['./e2e/**/*.test.ts'],
    setupFiles: './vitest.setup.ts',
  },
})
