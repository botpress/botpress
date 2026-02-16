import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
import { ZodNullableDef, ZodTypeAny } from '../../../z/index'
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
  const inner = def.innerType as ZodTypeAny
  if (
    ['ZodString', 'ZodNumber', 'ZodBigInt', 'ZodBoolean', 'ZodNull'].includes(inner._def.typeName) &&
    (!inner._def.checks || !inner._def.checks.length)
  ) {
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
    const base = parseDef(inner._def, {
      ...refs,
      currentPath: [...refs.currentPath],
    })

    return base && ({ ...base, nullable: true } as any)
  }

  const base = parseDef(inner._def, {
    ...refs,
    currentPath: [...refs.currentPath, 'anyOf', '0'],
  })

  return base && { anyOf: [base, { type: 'null' }] }
}
