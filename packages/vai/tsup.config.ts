import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  dts: false,
  outDir: 'dist',
  platform: 'neutral',
  // Cleaning on every watch-triggered rebuild would delete the .d.ts files the
  // separate tsc --watch process (see package.json's "watch" script) just wrote.
  clean: !options.watch,
  bundle: false,
}))
