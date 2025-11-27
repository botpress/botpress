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

export const BundledReleaseSyncVariant: QuickJSSyncVariant = {
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
