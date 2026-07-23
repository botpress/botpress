// Typed view of the wasmfile variant's engine module. The package's "./wasm"
// subpath maps straight to the .wasm file; on workerd (and via the workerd tsup
// build's copy loader) a static .wasm import resolves to a precompiled
// WebAssembly.Module.
declare module '@jitl/quickjs-wasmfile-release-sync/wasm' {
  const wasmModule: WebAssembly.Module
  export default wasmModule
}
