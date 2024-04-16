import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  format: ['esm', 'cjs'],
  sourcemap: true,
  keepNames: true,
  tsconfig: 'tsconfig.json',
  dts: true,
  platform: 'node',
  clean: true,
  shims: true,
  treeshake: true,
  minify: true,
  noExternal: ['@bpinternal/zui'],
  bundle: true,
})
