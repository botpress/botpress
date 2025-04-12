import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  outDir: 'dist',
  format: ['esm', 'cjs'],
  platform: 'neutral',
  clean: true,
  bundle: false,
})
