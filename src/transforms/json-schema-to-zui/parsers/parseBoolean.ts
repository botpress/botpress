import { JsonSchemaObject } from '../types'

export const parseBoolean = (_schema: JsonSchemaObject & { type: 'boolean' }) => {
  return 'z.boolean()'
}
