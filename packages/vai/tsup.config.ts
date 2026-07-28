import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: false,
  outDir: 'dist',
  platform: 'neutral',
  clean: true,
  bundle: false,
})
