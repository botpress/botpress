import { JSONSchema7, JSONSchema7Type } from 'json-schema'
import * as errs from '../../common/errors'
import z from '../../../z'
import { numberJSONSchemaToZuiNumber } from './number'
import { stringJSONSchemaToZuiString } from './string'

type ZuiPrimitive = keyof ZuiPrimitiveSchemas
type ZuiPrimitiveSchemas = {
  string: z.ZodString
  number: z.ZodNumber
  boolean: z.ZodBoolean
  null: z.ZodNull
}
type ZuiPrimitiveTypes = {
  string: string
  number: number
  boolean: boolean
  null: null
}

type ReturnType<T extends ZuiPrimitive> =
  | ZuiPrimitiveSchemas[T]
  | z.ZodLiteral<ZuiPrimitiveTypes[T]>
  | z.ZodUnion<[z.ZodLiteral<ZuiPrimitiveTypes[T]>, ...z.ZodLiteral<ZuiPrimitiveTypes[T]>[]]>

export const toZuiPrimitive = <T extends ZuiPrimitive>(type: T, schema: JSONSchema7): ReturnType<T> => {
  const values: JSONSchema7Type[] = []
  if (schema.enum !== undefined) {
    values.push(...schema.enum)
  }
  if (schema.const !== undefined) {
    values.push(schema.const)
  }

  let zuiPrimitive

  const primitiveValues = values.filter((value): value is ZuiPrimitiveTypes[T] => typeof value === type)
  const [first] = primitiveValues
  if (!first) {
    if (type === 'string' && schema.type === 'string') {
      zuiPrimitive = stringJSONSchemaToZuiString(schema as JSONSchema7 & { type: 'string' }) as ZuiPrimitiveSchemas[T]
    }
    if (type === 'number' && (schema.type === 'number' || schema.type === 'integer')) {
      zuiPrimitive = numberJSONSchemaToZuiNumber(
        schema as JSONSchema7 & { type: 'number' | 'integer' },
      ) as ZuiPrimitiveSchemas[T]
    }
    if (type === 'boolean') {
      zuiPrimitive = z.boolean() as ZuiPrimitiveSchemas[T]
    }
    if (type === 'null') {
      zuiPrimitive = z.null() as ZuiPrimitiveSchemas[T]
    }

    if (!zuiPrimitive) {
      throw new errs.JSONSchemaToZuiError(`Unknown primitive type: "${type}"`)
    }
  } else {
    if (primitiveValues.length === 1) {
      zuiPrimitive = z.literal(first) satisfies z.ZodLiteral<ZuiPrimitiveTypes[T]>
    } else {
      const items = primitiveValues.map((value) => z.literal(value)) as [
        z.ZodLiteral<ZuiPrimitiveTypes[T]>,
        z.ZodLiteral<ZuiPrimitiveTypes[T]>,
        ...z.ZodLiteral<ZuiPrimitiveTypes[T]>[],
      ]
      zuiPrimitive = z.union(items)
    }
  }

  if (schema.description) {
    zuiPrimitive = zuiPrimitive.describe(schema.description) as ZuiPrimitiveSchemas[T]
  }

  return zuiPrimitive
}
