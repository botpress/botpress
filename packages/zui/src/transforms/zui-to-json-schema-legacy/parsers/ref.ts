import { zuiKey } from '../../../z'
import { ZuiExtensionObject } from '../../../z'
import { ZodRefDef } from '../../../z/types/ref'

export type JsonSchema7RefType = {
  $ref: string
  [zuiKey]?: ZuiExtensionObject
}

export function parseRefDef(def: ZodRefDef): JsonSchema7RefType {
  return {
    $ref: def.uri,
  }
}
