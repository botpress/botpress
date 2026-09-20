import { defineConfig } from 'vitest/config'
import config from '../../vitest.config'

export default defineConfig({
  ...config,
  test: {
    ...config.test,
    exclude: config.test?.exclude?.map((pattern) => (pattern === '**/e2e/**' ? '**/e2e/*.test.ts' : pattern)),
    testTimeout: 10_000,
    setupFiles: './vitest.setup.ts',
    snapshotSerializers: ['./vitest.stack-trace-serializer.ts'],
    snapshotEnvironment: './vitest.snapshot.ts',
  },
})
