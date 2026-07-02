// ThickToken v3 exposes its declarations through package exports, which this
// package's current `moduleResolution: node` config cannot read. Keep this
// shim limited to the API Zai imports until Zai can move to a modern resolver.
declare module '@bpinternal/thicktoken/micro' {
  export type TextTokenizer = import('./tokenizer').TextTokenizer
  export const getWasmTokenizer: () => Promise<TextTokenizer>
}
