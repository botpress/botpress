import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'browser',
  // Matches the tsconfig. Left unset, tsdown infers it from engines.node and
  // emits syntax that older browsers cannot parse.
  target: 'es2017',
  deps: { neverBundle: ['react', 'react-dom'], onlyBundle: false },
  sourcemap: true,
  dts: true,
  clean: true,
  shims: true,
  fixedExtension: false,
  outputOptions: { keepNames: true, codeSplitting: false },
})
