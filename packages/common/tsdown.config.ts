import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  dts: true,
  platform: 'node',
  clean: true,
  format: ['cjs', 'esm'],
  target: false,
})
