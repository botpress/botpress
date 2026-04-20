import { JsonSchemaObject, Serializable } from '../types'

export const parseConst = (schema: JsonSchemaObject & { const: Serializable }) => {
  return `z.literal(${JSON.stringify(schema.const)})`
}
