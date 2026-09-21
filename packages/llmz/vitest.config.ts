import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import config from '../../vitest.config'

export default defineConfig({
  ...config,
  resolve: { alias: { llmz: fileURLToPath(new URL('./src/index.ts', import.meta.url)) } },
  test: {
    ...config.test,
    exclude: config.test?.exclude?.map((pattern) => (pattern === '**/e2e/**' ? '**/e2e/*.test.ts' : pattern)),
    testTimeout: 10_000,
    setupFiles: './vitest.setup.ts',
    snapshotSerializers: ['./vitest.stack-trace-serializer.ts'],
    snapshotEnvironment: './vitest.snapshot.ts',
  },
})
