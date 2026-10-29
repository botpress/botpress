import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  // Keep the declaration entrypoint bundled so operation module augmentations
  // like zai.extract/check/summarize are visible from @botpress/zai.
  dts: true,
  outDir: 'dist',
  format: ['esm', 'cjs'],
  fixedExtension: true,
  target: 'node18',
  // lodash-es and p-limit are ESM-only; bundle them so the CJS build can be required.
  deps: { alwaysBundle: ['lodash-es', 'p-limit'], onlyBundle: false },
  sourcemap: false,
  clean: true,
})
