import { defineConfig } from 'tsup'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'

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
  plugins: [
    polyfillNode({
      polyfills: {
        path: true,
        process: true,
      },
    }),
  ],
})
