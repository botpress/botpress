import { JsonSchemaObject } from '../types'

export const parseNull = (_schema: JsonSchemaObject & { type: 'null' }) => {
  return 'z.null()'
}
