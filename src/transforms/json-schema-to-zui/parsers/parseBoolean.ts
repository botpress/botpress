import { zuiKey } from '../../../ui/constants'
import { JsonSchemaObject } from '../types'

export const parseBoolean = (_schema: JsonSchemaObject & { type: 'boolean' }) => {
  if (_schema[zuiKey]?.coerce) {
    return 'z.coerce.boolean()'
  }
  return 'z.boolean()'
}
