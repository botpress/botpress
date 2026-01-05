import { zuiKey } from '../../../ui/constants'
import { JsonSchemaObject } from '../types'
import { withMessage } from '../utils'

export const parseString = (schema: JsonSchemaObject & { type: 'string' }) => {
  let r = 'z.string()'
  if (schema[zuiKey]?.coerce) {
    if (schema.format === 'date-time') {
      return 'z.coerce.date()'
    }
    r = 'z.coerce.string()'
  }

  r += withMessage(schema, 'format', ({ value }) => {
    switch (value) {
      case 'email':
        return ['.email(', ')']
      case 'ip':
        return ['.ip(', ')']
      case 'ipv4':
        return ['.ip({ version: "v4"', ', message: ', ' })']
      case 'ipv6':
        return ['.ip({ version: "v6"', ', message: ', ' })']
      case 'uri':
        return ['.url(', ')']
      case 'uuid':
        return ['.uuid(', ')']
      case 'date-time':
        return ['.datetime(', ')']
    }
  })

  r += withMessage(schema, 'pattern', ({ json }) => [`.regex(new RegExp(${json})`, ', ', ')'])

  r += withMessage(schema, 'minLength', ({ json }) => [`.min(${json}`, ', ', ')'])

  r += withMessage(schema, 'maxLength', ({ json }) => [`.max(${json}`, ', ', ')'])

  return r
}
