import { JSONSchema7, JSONSchema7Type } from 'json-schema'
import * as errs from '../common/errors'
import z from '../../z'

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

  const primitiveValues = values.filter((value): value is ZuiPrimitiveTypes[T] => typeof value === type)
  const [first] = primitiveValues
  if (!first) {
    if (type === 'string') {
      return z.string() as ZuiPrimitiveSchemas[T]
    }
    if (type === 'number') {
      return z.number() as ZuiPrimitiveSchemas[T]
    }
    if (type === 'boolean') {
      return z.boolean() as ZuiPrimitiveSchemas[T]
    }
    if (type === 'null') {
      return z.null() as ZuiPrimitiveSchemas[T]
    }
    throw new errs.JSONSchemaToZuiError(`Unknown primitive type: "${type}"`)
  }

  if (primitiveValues.length === 1) {
    return z.literal(first) satisfies z.ZodLiteral<ZuiPrimitiveTypes[T]>
  }

  const items = primitiveValues.map((value) => z.literal(value)) as [
    z.ZodLiteral<ZuiPrimitiveTypes[T]>,
    z.ZodLiteral<ZuiPrimitiveTypes[T]>,
    ...z.ZodLiteral<ZuiPrimitiveTypes[T]>[],
  ]
  return z.union(items)
}
