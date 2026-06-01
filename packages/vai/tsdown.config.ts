import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  outDir: 'dist',
  platform: 'neutral',
  clean: true,
  unbundle: true,
  format: 'cjs',
  target: false,
})
