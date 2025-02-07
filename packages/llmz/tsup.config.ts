import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*.{ts,tsx}', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/__tests__/**'],
  outDir: 'dist',
  dts: true,
  format: ['esm'],
  target: 'node16',

  sourcemap: false,

  outExtension: () => {
    return { js: '.js', dts: '.d.ts' }
  },
  clean: true,
  splitting: false,
  minify: false,
})
