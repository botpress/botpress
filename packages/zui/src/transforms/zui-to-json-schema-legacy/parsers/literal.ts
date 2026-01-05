import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
import { ZodLiteralDef } from '../../../z/index'
import { Refs } from '../Refs'

export type JsonSchema7LiteralType =
  | {
      type: 'string' | 'number' | 'integer' | 'boolean'
      const: string | number | boolean
      [zuiKey]?: ZuiExtensionObject
    }
  | {
      type: 'object' | 'array'
      [zuiKey]?: ZuiExtensionObject
    }

export function parseLiteralDef(def: ZodLiteralDef, refs: Refs): JsonSchema7LiteralType {
  const parsedType = typeof def.value
  if (parsedType !== 'bigint' && parsedType !== 'number' && parsedType !== 'boolean' && parsedType !== 'string') {
    return {
      type: Array.isArray(def.value) ? 'array' : 'object',
    }
  }

  if (refs.target === 'openApi3') {
    return {
      type: parsedType === 'bigint' ? 'integer' : parsedType,
      enum: [def.value],
    } as any
  }

  return {
    type: parsedType === 'bigint' ? 'integer' : parsedType,
    const: def.value,
  } as JsonSchema7LiteralType
}
