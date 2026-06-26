import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  outDir: 'dist',
  platform: 'neutral',
  clean: true,
  // Keep the declaration entrypoint bundled so operation module augmentations
  // like zai.extract/check/summarize are visible from @botpress/zai.
  unbundle: false,
  format: 'cjs',
  target: undefined,
})
