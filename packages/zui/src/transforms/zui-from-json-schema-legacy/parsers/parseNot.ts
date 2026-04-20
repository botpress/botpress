import { JsonSchemaObject, JsonSchema, Refs } from '../types'
import { parseSchema } from './parseSchema'

export const parseNot = (schema: JsonSchemaObject & { not: JsonSchema }, refs: Refs) => {
  return `z.any().refine((value) => !${parseSchema(schema.not, {
    ...refs,
    path: [...refs.path, 'not'],
  })}.safeParse(value).success, "Invalid input: Should NOT be valid against schema")`
}
