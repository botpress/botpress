import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  dts: true,
  platform: 'browser',
  clean: true,
  shims: true,
  unbundle: false,
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
})
