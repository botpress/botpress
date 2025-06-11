import { zuiKey } from '../../../ui/constants'
import z from '../../../z'
import * as json from '../../common/json-schema'

export const zodTupleToJsonTuple = (
  zodTuple: z.ZodTuple,
  toSchema: (x: z.ZodTypeAny) => json.ZuiJSONSchema,
): json.TupleSchema => {
  const schema: json.TupleSchema = {
    type: 'array',
    description: zodTuple.description,
    items: zodTuple._def.items.map((item) => toSchema(item)),
  }

  if (zodTuple._def[zuiKey]) {
    schema[zuiKey] = zodTuple._def[zuiKey]
  }

  if (zodTuple._def.rest) {
    schema.additionalItems = toSchema(zodTuple._def.rest)
  }

  return schema
}
