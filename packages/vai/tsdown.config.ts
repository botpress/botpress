import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'cjs',
  dts: true,
  outDir: 'dist',
  platform: 'neutral',
  unbundle: true,
  clean: true,
})
