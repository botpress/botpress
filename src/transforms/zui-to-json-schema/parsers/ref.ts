import { ZodRefDef } from '../../../z/types/ref'

export type JsonSchema7RefType = {
  $ref: string
}

export function parseRefDef(def: ZodRefDef): JsonSchema7RefType {
  return {
    $ref: def.uri,
  }
}
