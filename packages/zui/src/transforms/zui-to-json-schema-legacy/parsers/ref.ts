import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
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
