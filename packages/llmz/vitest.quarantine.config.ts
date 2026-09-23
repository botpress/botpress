import { defineConfig, mergeConfig } from 'vitest/config'
import e2e from './vitest.e2e.config.js'

export default mergeConfig(
  e2e,
  defineConfig({
    test: {
      env: { LLMZ_E2E_QUARANTINE: '1' },
      testNamePattern: /\[quarantined\]/,
    },
  })
)
