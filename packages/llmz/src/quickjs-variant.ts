import type { QuickJSSyncVariant } from 'quickjs-emscripten-core'

/**
 * QuickJS variant using the singlefile browser release.
 * This variant has WASM inlined as base64 directly in the JavaScript file.
 * No separate .wasm files, no path resolution issues, no import.meta.url problems.
 * Works everywhere: Node.js, browsers, bundlers, AWS Lambda, etc.
 */
const getVariant = async (): Promise<QuickJSSyncVariant> => {
  const module = await import('@jitl/quickjs-singlefile-browser-release-sync')
  return module.default as unknown as QuickJSSyncVariant
}

export type QuickJSSyncVariantEx = QuickJSSyncVariant & {
  _wasmSource?: any
  _wasmLoadedSuccessfully?: any
  _wasmSize?: any
  _wasmLoadError?: any
}

export const BundledReleaseSyncVariant: QuickJSSyncVariantEx = {
  type: 'sync',
  importFFI: async () => {
    const variant = await getVariant()
    return variant.importFFI()
  },
  importModuleLoader: async () => {
    const variant = await getVariant()
    return variant.importModuleLoader()
  },
}

let _activeVariant: QuickJSSyncVariant = BundledReleaseSyncVariant

/**
 * Overrides the QuickJS variant used by the sandbox.
 *
 * The default variant inlines the WASM as base64 and compiles it at runtime
 * (`new WebAssembly.Module(bytes)`), which is disallowed on some platforms
 * (e.g. Cloudflare Workers / workerd). On those platforms, inject a variant
 * built from a statically imported precompiled `WebAssembly.Module` — e.g.
 * quickjs-emscripten's documented Cloudflare recipe:
 *
 * ```ts
 * import { newVariant } from 'quickjs-emscripten-core'
 * import wasmfileVariant from '@jitl/quickjs-wasmfile-release-sync'
 * import wasmModule from '@jitl/quickjs-wasmfile-release-sync/wasm'
 *
 * configureQuickJS(newVariant(wasmfileVariant, { wasmModule }))
 * ```
 *
 * Call this before the first `execute()` (or `warmupVM()`); the WASM module is
 * loaded once per variant and cached.
 */
export const configureQuickJS = (variant: QuickJSSyncVariant) => {
  _activeVariant = variant
}

export const getQuickJSVariant = (): QuickJSSyncVariant => _activeVariant
