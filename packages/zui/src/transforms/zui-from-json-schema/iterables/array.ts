import { JSONSchema7Definition } from 'json-schema'
import { builders as z } from '../../../internal-builders'
import type { IZodType, IZodArray, IZodSet, IZodTuple } from '../../../typings'
import { ArraySchema, SetSchema, TupleSchema } from '../../common/json-schema'

export const arrayJSONSchemaToZuiArray = (
  schema: ArraySchema | SetSchema | TupleSchema,
  toZui: (x: JSONSchema7Definition) => IZodType
): IZodArray | IZodSet | IZodTuple =>
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
  toZui: (x: JSONSchema7Definition) => IZodType
): IZodTuple => {
  const itemSchemas = items.map(toZui) as [] | [IZodType, ...IZodType[]]
  let zodTuple: IZodTuple<any, any> = z.tuple(itemSchemas)

  if (additionalItems !== undefined) {
    zodTuple = zodTuple.rest(toZui(additionalItems))
  }

  return zodTuple
}

const _handleSet = (
  { items, minItems, maxItems }: SetSchema,
  toZui: (x: JSONSchema7Definition) => IZodType
): IZodSet => {
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
  toZui: (x: JSONSchema7Definition) => IZodType
): IZodArray | IZodSet | IZodTuple => {
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
