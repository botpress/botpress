import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', '!src/**/*.test.{ts,tsx}', '!e2e'],
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
