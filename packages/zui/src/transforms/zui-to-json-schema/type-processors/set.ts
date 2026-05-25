import * as utils from '../../../utils'
import * as z from '../../../z'
import * as err from '../../common/errors'
import * as json from '../../common/json-schema'

const { zuiKey } = z

export const zodSetToJsonSet = (zodSet: z.ZodSet, toSchema: (x: z.ZodType) => json.Schema): json.SetSchema => {
  const items = (() => {
    try {
      return toSchema(zodSet._def.valueType)
    } catch (e) {
      if (e instanceof err.ZuiTransformError) {
        utils.errors.prependPathSegment(e, '[*]')
      }
      throw e
    }
  })()

  const schema: json.SetSchema = {
    type: 'array',
    description: zodSet.description,
    uniqueItems: true,
    items,
    'x-zui': zodSet._def['x-zui'],
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
