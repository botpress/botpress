import 'dotenv/config'
import { defineConfig } from 'vitest/config'
import CacheReporter from './e2e/__tests__/cache-reporter.js'

export default defineConfig({
  assetsInclude: '**/*.md',
  test: {
    reporters: ['default', new CacheReporter()],
    retry: 2, // because LLMs can fail
    testTimeout: 60_000, // because LLMs can be slow
    teardownTimeout: 10_000,
    snapshotSerializers: ['./vitest.stack-trace-serializer.ts'],
    maxConcurrency: 1,
    // Each file makes live provider requests; avoid a burst of independent fallback chains.
    fileParallelism: false,
    isolate: false,
    allowOnly: true,
    pool: 'forks',
    setupFiles: './vitest.e2e.setup.ts',
    include: ['./e2e/**/*.test.ts'],
    exclude: ['./e2e/__tests__/**/*.test.ts'],
  },
})
