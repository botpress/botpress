import { zuiKey } from '../../../ui/constants'
import z from '../../../z'
import * as json from '../../common/json-schema'

export const zodArrayToJsonArray = (
  zodArray: z.ZodArray,
  toSchema: (x: z.ZodTypeAny) => json.ZuiJsonSchema,
): json.ArraySchema => {
  const schema: json.ArraySchema = {
    type: 'array',
    items: toSchema(zodArray._def.type),
  }

  if (zodArray._def[zuiKey]) {
    schema[zuiKey] = zodArray._def[zuiKey]
  }

  if (zodArray._def.minLength) {
    schema.minItems = zodArray._def.minLength.value
  }

  if (zodArray._def.maxLength) {
    schema.maxItems = zodArray._def.maxLength.value
  }

  if (zodArray._def.exactLength) {
    schema.minItems = zodArray._def.exactLength.value
    schema.maxItems = zodArray._def.exactLength.value
  }

  return schema
}
