import 'dotenv/config'
import { defineConfig } from 'vitest/config'
import fs from 'node:fs'

function textLoader() {
  return {
    name: 'text-loader',
    transform(src, id) {
      if (id.endsWith('.txt')) {
        const content = fs.readFileSync(id, 'utf-8')
        return {
          code: `export default ${JSON.stringify(content)};`,
          map: null,
        }
      }
    },
  }
}

function mdLoader() {
  return {
    name: 'md-loader',
    transform(src, id) {
      if (id.endsWith('.md')) {
        const content = fs.readFileSync(id, 'utf-8')
        return {
          code: `export default ${JSON.stringify(content)};`,
          map: null,
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [textLoader(), mdLoader()],
  resolve: {
    extensions: ['.js', '.ts', '.json', '.txt', '.md'],
  },
  assetsInclude: '**/*.md',
  test: {
    retry: 2, // because LLMs can fail
    testTimeout: 60_000, // because LLMs can be slow
    teardownTimeout: 10_000,
    snapshotSerializers: ['./vitest.stack-trace-serializer.ts'],
    snapshotEnvironment: './vitest.snapshot.ts',
    maxConcurrency: 1,
    isolate: false,
    allowOnly: true,
    pool: 'forks',
    setupFiles: './vitest.setup.ts',
  },
})
