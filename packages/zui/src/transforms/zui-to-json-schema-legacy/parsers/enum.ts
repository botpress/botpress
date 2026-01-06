import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
import { ZodEnumDef } from '../../../z/index'

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
