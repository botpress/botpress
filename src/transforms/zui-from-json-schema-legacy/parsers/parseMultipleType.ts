import { JsonSchemaObject, Refs } from '../types'
import { parseSchema } from './parseSchema'

export const parseMultipleType = (schema: JsonSchemaObject & { type: string[] }, refs: Refs) => {
  return `z.union([${schema.type.map((type) => parseSchema({ ...schema, type }, refs)).join(', ')}])`
}
