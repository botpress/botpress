import * as utils from '../../../utils'
import * as z from '../../../z'
import * as err from '../../common/errors'
import * as json from '../../common/json-schema'

const { zuiKey } = z

export const zodTupleToJsonTuple = (
  zodTuple: z.ZodTuple,
  toSchema: (x: z.ZodType) => json.Schema
): json.TupleSchema => {
  const schema: json.TupleSchema = {
    type: 'array',
    description: zodTuple.description,
    items: zodTuple._def.items.map((item, index) => {
      try {
        return toSchema(item)
      } catch (e) {
        if (e instanceof err.UnsupportedZuiToJSONSchemaError) {
          utils.errors.prependPathSegment(e, `[${index}]`)
        }
        throw e
      }
    }),
  }

  if (zodTuple._def[zuiKey]) {
    schema[zuiKey] = zodTuple._def[zuiKey]
  }

  if (zodTuple._def.rest) {
    schema.additionalItems = toSchema(zodTuple._def.rest)
  }

  return schema
}
