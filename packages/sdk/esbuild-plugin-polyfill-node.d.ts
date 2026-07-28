declare module 'esbuild-plugin-polyfill-node' {
  import type { Plugin } from 'esbuild'

  export function polyfillNode(options?: { polyfills?: Record<string, boolean> }): Plugin
}
