import { ArraySchema, SetSchema, TupleSchema } from '../../common/json-schema'
import z from '../../../z'
import { JSONSchema7Definition } from 'json-schema'

export const arrayJSONSchemaToZuiArray = (
  schema: ArraySchema | SetSchema | TupleSchema,
  toZui: (x: JSONSchema7Definition) => z.ZodTypeAny,
): z.ZodArray | z.ZodSet | z.ZodTuple =>
  _isTuple(schema)
    ? _handleTuple(schema, toZui)
    : _isSet(schema)
      ? _handleSet(schema, toZui)
      : _handleArray(schema, toZui)

const _isTuple = (schema: ArraySchema | SetSchema | TupleSchema): schema is TupleSchema => Array.isArray(schema.items)

const _isSet = (schema: ArraySchema | SetSchema | TupleSchema): schema is SetSchema =>
  schema.items !== undefined && (schema as SetSchema).uniqueItems

const _handleTuple = (
  { items, additionalItems }: TupleSchema,
  toZui: (x: JSONSchema7Definition) => z.ZodTypeAny,
): z.ZodTuple => {
  const itemSchemas = items.map(toZui) as [] | [z.ZodType, ...z.ZodType[]]
  let zodTuple: z.ZodTuple<any, any> = z.tuple(itemSchemas)

  if (additionalItems !== undefined) {
    zodTuple = zodTuple.rest(toZui(additionalItems))
  }

  return zodTuple
}

const _handleSet = (
  { items, minItems, maxItems }: SetSchema,
  toZui: (x: JSONSchema7Definition) => z.ZodTypeAny,
): z.ZodSet => {
  let zodSet = z.set(toZui(items))

  if (minItems) {
    zodSet = zodSet.min(minItems)
  }

  if (maxItems) {
    zodSet = zodSet.max(maxItems)
  }

  return zodSet
}

const _handleArray = (
  { minItems, maxItems, items }: ArraySchema,
  toZui: (x: JSONSchema7Definition) => z.ZodTypeAny,
): z.ZodArray | z.ZodSet | z.ZodTuple => {
  let zodArray = z.array(toZui(items))

  if (minItems && minItems === maxItems) {
    return zodArray.length(minItems)
  }

  if (minItems) {
    zodArray = zodArray.min(minItems)
  }

  if (maxItems) {
    zodArray = zodArray.max(maxItems)
  }

  return zodArray
}
