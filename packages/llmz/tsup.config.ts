import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', '!src/**/*.test.{ts,tsx}', '!src/**/__tests__/**'],
  outDir: 'dist',
  dts: false,
  format: ['esm', 'cjs'],
  target: 'node16',
  noExternal: ['lodash-es', 'source-map-js'],
  cjsInterop: true,
  sourcemap: false,
  clean: true,
  splitting: true,
  minify: false,
  bundle: true,
})
