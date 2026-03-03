import { zuiKey } from '../../../consts'
import type { ZuiExtensionObject } from '../../../typings'
import { ZodRefDef } from '../../../types/ref'

export type JsonSchema7RefType = {
  $ref: string
  [zuiKey]?: ZuiExtensionObject
}

export function parseRefDef(def: ZodRefDef): JsonSchema7RefType {
  return {
    $ref: def.uri,
  }
}
