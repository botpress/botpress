import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
import { ZodNullableDef } from '../../../z/index'
import { addMeta, JsonSchema7Type, parseDef } from '../parseDef'
import { Refs } from '../Refs'
import { JsonSchema7NullType } from './null'
import { primitiveMappings } from './union'

export type JsonSchema7NullableType =
  | {
      anyOf: [JsonSchema7Type, JsonSchema7NullType]
      [zuiKey]?: ZuiExtensionObject
    }
  | {
      type: [string, 'null']
      [zuiKey]?: ZuiExtensionObject
    }

export function parseNullableDef(def: ZodNullableDef, refs: Refs): JsonSchema7NullableType | undefined {
  if (
    ['ZodString', 'ZodNumber', 'ZodBigInt', 'ZodBoolean', 'ZodNull'].includes(def.innerType._def.typeName) &&
    (!def.innerType._def.checks || !def.innerType._def.checks.length)
  ) {
    const inner = def.innerType
    if (refs.target === 'openApi3') {
      const schema = {
        type: primitiveMappings[inner._def.typeName as keyof typeof primitiveMappings],
        nullable: true,
      } as any
      return addMeta(inner._def, refs, schema)
    }

    const schema: JsonSchema7NullableType = {
      type: [primitiveMappings[inner._def.typeName as keyof typeof primitiveMappings], 'null'],
    }
    return addMeta(inner._def, refs, schema)
  }

  if (refs.target === 'openApi3') {
    const base = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath],
    })

    return base && ({ ...base, nullable: true } as any)
  }

  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, 'anyOf', '0'],
  })

  return base && { anyOf: [base, { type: 'null' }] }
}
