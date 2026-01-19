import fs from 'fs'
import { defineConfig } from 'vitest/config'
import config from '../../vitest.config'

function textLoader() {
  return {
    name: 'text-loader',
    transform(_src: string, id: string) {
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
    transform(_src: string, id: string) {
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
  ...config,
  plugins: [textLoader(), mdLoader()],
  resolve: {
    extensions: ['.js', '.ts', '.json', '.txt', '.md'],
  },
  test: {
    ...config.test,
    testTimeout: 10_000,
    setupFiles: './vitest.setup.ts',
    snapshotSerializers: ['./vitest.e2e.stack-trace-serializer.ts'],
    snapshotEnvironment: './vitest.e2e.snapshot.ts',
  },
})
