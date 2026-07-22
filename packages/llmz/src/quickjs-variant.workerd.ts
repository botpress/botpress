import wasmfileVariantImport from '@jitl/quickjs-wasmfile-release-sync'
// Static import of the engine .wasm: the workerd tsup build copies it to dist as a
// separate file and Cloudflare Workers compiles it at deploy time, handing us a
// precompiled WebAssembly.Module (runtime WASM compilation is banned on workerd).
import wasmModule from '@jitl/quickjs-wasmfile-release-sync/wasm'
import { newVariant, type QuickJSSyncVariant } from 'quickjs-emscripten-core'

// TS (NodeNext) types the package's CJS-flavored d.ts as a namespace ({ default: variant })
// while the bundled ESM build resolves the default import to the variant itself — unwrap
// defensively so both module shapes work.
const wasmfileVariant = ((wasmfileVariantImport as { default?: QuickJSSyncVariant }).default ??
  wasmfileVariantImport) as QuickJSSyncVariant

/**
 * Workerd (Cloudflare Workers) drop-in replacement for `./quickjs-variant.ts` —
 * the workerd tsup build aliases that module to this one. Same export surface,
 * but the default variant follows quickjs-emscripten's documented Cloudflare
 * recipe (wasmfile variant + statically imported precompiled module) instead of
 * the singlefile variant that compiles inlined base64 WASM at runtime.
 */
export type QuickJSSyncVariantEx = QuickJSSyncVariant & {
  _wasmSource?: any
  _wasmLoadedSuccessfully?: any
  _wasmSize?: any
  _wasmLoadError?: any
}

export const BundledReleaseSyncVariant: QuickJSSyncVariantEx = newVariant(wasmfileVariant, { wasmModule })

let _activeVariant: QuickJSSyncVariant = BundledReleaseSyncVariant

/**
 * Overrides the QuickJS variant used by the sandbox. On workerd the default
 * variant is already Workers-compatible; this stays available for consumers
 * who want a different QuickJS build (e.g. debug, asyncify).
 */
export const configureQuickJS = (variant: QuickJSSyncVariant) => {
  _activeVariant = variant
}

export const getQuickJSVariant = (): QuickJSSyncVariant => _activeVariant
