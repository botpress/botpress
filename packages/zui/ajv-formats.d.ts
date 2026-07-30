declare module 'ajv-formats' {
  import type { Ajv } from 'ajv'

  export default function addFormats(ajv: Ajv): Ajv
}
