import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  assetsInclude: '**/*.md',
  test: {
    retry: 2, // because LLMs can fail
    testTimeout: 60_000, // because LLMs can be slow
    teardownTimeout: 10_000,
    snapshotSerializers: ['./vitest.stack-trace-serializer.ts'],
    maxConcurrency: 1,
    isolate: false,
    allowOnly: true,
    pool: 'forks',
    setupFiles: './vitest.e2e.setup.ts',
    include: ['./e2e/**/*.test.ts'],
  },
})
