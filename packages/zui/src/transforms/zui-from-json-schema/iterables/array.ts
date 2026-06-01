import { JSONSchema7Definition } from 'json-schema'
import { PropertyPath } from '../../../utils/property-path-utils'
import * as z from '../../../z'
import { ArraySchema, SetSchema, TupleSchema } from '../../common/json-schema'

export const arrayJSONSchemaToZuiArray = (
  schema: ArraySchema | SetSchema | TupleSchema,
  toZui: (x: JSONSchema7Definition, path: PropertyPath) => z.ZodType,
  path: PropertyPath
): z.ZodArray | z.ZodSet | z.ZodTuple =>
  _isTuple(schema)
    ? _handleTuple(schema, toZui, path)
    : _isSet(schema)
      ? _handleSet(schema, toZui, path)
      : _handleArray(schema, toZui, path)

const _isTuple = (schema: ArraySchema | SetSchema | TupleSchema): schema is TupleSchema => Array.isArray(schema.items)

const _isSet = (schema: ArraySchema | SetSchema | TupleSchema): schema is SetSchema =>
  schema.items !== undefined && (schema as SetSchema).uniqueItems

const _handleTuple = (
  { items, additionalItems }: TupleSchema,
  toZui: (x: JSONSchema7Definition, path: PropertyPath) => z.ZodType,
  path: PropertyPath
): z.ZodTuple => {
  const itemSchemas = items.map((item, index) => toZui(item, path.withIndexType('number', index))) as
    | []
    | [z.ZodType, ...z.ZodType[]]
  let zodTuple: z.ZodTuple = z.tuple(itemSchemas)

  if (additionalItems !== undefined) {
    zodTuple = zodTuple.rest(toZui(additionalItems, path.withIndexType('number')))
  }

  return zodTuple
}

const _handleSet = (
  { items, minItems, maxItems }: SetSchema,
  toZui: (x: JSONSchema7Definition, path: PropertyPath) => z.ZodType,
  path: PropertyPath
): z.ZodSet => {
  let zodSet = z.set(toZui(items, path.withIndexType('number')))

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
  toZui: (x: JSONSchema7Definition, path: PropertyPath) => z.ZodType,
  path: PropertyPath
): z.ZodArray | z.ZodSet | z.ZodTuple => {
  let zodArray = z.array(toZui(items, path.withIndexType('number')))

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
