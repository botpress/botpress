// ajv-formats ships `export default` in its own .d.ts despite having no "type": "module",
// which breaks default-import type resolution under moduleResolution: NodeNext regardless
// of import syntax. This overrides its types for our own type-checking only; the real
// runtime module is untouched.
declare module 'ajv-formats' {
  import type { Ajv } from 'ajv'

  export default function addFormats(ajv: Ajv): Ajv
}
