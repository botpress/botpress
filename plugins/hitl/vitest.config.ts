import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import config from '../../vitest.config'
export default mergeConfig(
  config,
  defineConfig({
    resolve: {
      alias: {
        'plugin.definition': fileURLToPath(new URL('./plugin.definition.ts', import.meta.url)),
        src: fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  })
)
