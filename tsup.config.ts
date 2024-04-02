import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  format: ['esm', 'cjs'],
  sourcemap: true,
  keepNames: true,
  dts: true,
  platform: 'browser',
  clean: true,
  shims: true,
  external: ['zod', 'react', 'react-dom'],
  bundle: true,
})
