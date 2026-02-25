import { zuiKey } from '../../../z'
import { ZuiExtensionObject } from '../../../z'
import { ZodEnumDef } from '../../../z'

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
