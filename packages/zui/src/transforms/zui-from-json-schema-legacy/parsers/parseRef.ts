import { JsonSchemaObject } from '../types'

export const parseRef = (schema: JsonSchemaObject & { $ref: string }) => {
  return `z.ref('${schema.$ref}')`
}
