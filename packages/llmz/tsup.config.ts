import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig([
  {
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
  },
  // Workerd (Cloudflare Workers) build, resolved via the "workerd" exports condition.
  // workerd bans runtime WASM compilation, so this build swaps the QuickJS variant for
  // the wasmfile one: the engine .wasm ships as a separate dist file and stays a static
  // import that workerd compiles at deploy time (quickjs-emscripten's Cloudflare recipe).
  // The wasmfile variant is a devDependency bundled at build time — the regular builds
  // above are untouched and no runtime dependency is added.
  {
    entry: { 'index.workerd': 'src/index.ts' },
    outDir: 'dist',
    dts: false,
    format: ['esm'],
    target: 'es2022',
    platform: 'neutral',
    noExternal: ['lodash-es', 'source-map-js', '@jitl/quickjs-wasmfile-release-sync'],
    sourcemap: false,
    clean: false,
    splitting: false,
    minify: false,
    bundle: true,
    loader: { '.wasm': 'copy' },
    esbuildOptions(options) {
      // Stable (unhashed) name for the copied engine .wasm.
      options.assetNames = '[name]'
      // Resolve the wasmfile variant's internal emscripten-module import to its
      // cloudflare build. Setting conditions drops esbuild's implicit 'module'
      // condition, so re-add it.
      options.conditions = ['workerd', 'module']
    },
    esbuildPlugins: [
      {
        // Swap the QuickJS variant module for the workerd one (static wasm import)
        name: 'workerd-quickjs-variant',
        setup(build) {
          build.onResolve({ filter: /quickjs-variant\.js$/ }, () => ({
            path: path.resolve(__dirname, 'src/quickjs-variant.workerd.ts'),
          }))
        },
      },
    ],
  },
])
