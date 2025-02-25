import { zuiKey } from '../../../ui/constants'
import z from '../../../z'
import * as json from '../../common/json-schema'

export const zodNumberToJsonNumber = (zodNumber: z.ZodNumber): json.NumberSchema => {
  const schema: json.NumberSchema = {
    type: 'number',
  }

  if (zodNumber._def[zuiKey]) {
    schema[zuiKey] = zodNumber._def[zuiKey]
  }

  for (const check of zodNumber._def.checks) {
    switch (check.kind) {
      case 'min': {
        const key = check.inclusive ? 'minimum' : 'exclusiveMinimum'
        const oppositeKey = check.inclusive ? 'exclusiveMinimum' : 'minimum'

        schema[key] = check.value
        delete schema[oppositeKey]
        break
      }

      case 'max': {
        const key = check.inclusive ? 'maximum' : 'exclusiveMaximum'
        const oppositeKey = check.inclusive ? 'exclusiveMaximum' : 'maximum'

        schema[key] = check.value
        delete schema[oppositeKey]
        break
      }

      case 'int':
        schema.type = 'integer'
        break

      case 'finite': {
        schema.format = 'finite'
        break
      }

      case 'multipleOf':
        schema.multipleOf = check.value
        break

      default:
        check satisfies never
    }
  }

  return schema
}
