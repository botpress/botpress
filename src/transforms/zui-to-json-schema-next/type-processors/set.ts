import { zuiKey } from '../../../ui/constants'
import z from '../../../z'
import * as json from '../../common/json-schema'

export const zodSetToJsonSet = (
  zodSet: z.ZodSet,
  toSchema: (x: z.ZodTypeAny) => json.ZuiJsonSchema,
): json.SetSchema => {
  const schema: json.SetSchema = {
    type: 'array',
    uniqueItems: true,
    items: toSchema(zodSet._def.valueType),
  }

  if (zodSet._def[zuiKey]) {
    schema[zuiKey] = zodSet._def[zuiKey]
  }

  if (zodSet._def.minSize) {
    schema.minItems = zodSet._def.minSize.value
  }

  if (zodSet._def.maxSize) {
    schema.maxItems = zodSet._def.maxSize.value
  }

  return schema
}
