import * as utils from '../../../utils'
import * as z from '../../../z'
import * as err from '../../common/errors'
import * as json from '../../common/json-schema'

const { zuiKey } = z

export const zodArrayToJsonArray = (
  zodArray: z.ZodArray,
  toSchema: (x: z.ZodType) => json.Schema
): json.ArraySchema => {
  const items = (() => {
    try {
      return toSchema(zodArray._def.type)
    } catch (e) {
      if (e instanceof err.ZuiTransformError) {
        utils.errors.prependPathSegment(e, '[number]')
      }
      throw e
    }
  })()

  const schema: json.ArraySchema = {
    type: 'array',
    description: zodArray.description,
    items,
    'x-zui': zodArray._def['x-zui'],
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
