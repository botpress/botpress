import path from 'path'
import { defineConfig } from 'tsdown'

const ALWAYS_BUNDLED_DEPS = ['lodash-es', 'source-map-js']

export default defineConfig([
  {
    entry: ['src/index.ts'],
    fixedExtension: false,
    dts: false,
    format: ['esm', 'cjs'],
    target: 'node16',
    deps: { alwaysBundle: ALWAYS_BUNDLED_DEPS, onlyBundle: false },
    sourcemap: false,
    clean: true,
  },
  // Cloudflare Workers refuse to compile WebAssembly at runtime, so this build
  // swaps in the QuickJS variant that keeps its engine in a separate file:
  {
    entry: { 'index.workerd': 'src/index.ts' },
    dts: false,
    format: ['esm'],
    target: 'es2022',
    platform: 'browser',
    deps: {
      alwaysBundle: [...ALWAYS_BUNDLED_DEPS, '@jitl/quickjs-wasmfile-release-sync'],
      onlyBundle: false,
    },
    sourcemap: false,
    clean: false,
    inputOptions: {
      // Setting conditions drops the implicit 'module' condition, so re-add it.
      resolve: { conditionNames: ['workerd', 'module'] },
    },
    loader: { '.wasm': 'copy' },
    outputOptions: { codeSplitting: false, assetFileNames: '[name][extname]' },
    plugins: [
      {
        name: 'workerd-quickjs-variant',
        resolveId: (source: string) =>
          source.endsWith('quickjs-variant.js')
            ? path.resolve(import.meta.dirname, 'src/quickjs-variant.workerd.ts')
            : null,
      },
    ],
  },
])
