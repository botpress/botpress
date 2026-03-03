import { zuiKey } from '../../../consts'
import type { ZuiExtensionObject, ZodEnumDef } from '../../../typings'

export type JsonSchema7EnumType = {
  type: 'string'
  enum: string[]
  [zuiKey]?: ZuiExtensionObject
}

export function parseEnumDef(def: ZodEnumDef): JsonSchema7EnumType {
  return {
    type: 'string',
    enum: def.values,
  }
}
