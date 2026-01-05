import { JsonSchemaObject, Refs } from '../types'
import { omit } from '../utils'
import { parseSchema } from './parseSchema'

/**
 * For compatibility with open api 3.0 nullable
 */
export const parseNullable = (schema: JsonSchemaObject & { nullable: true }, refs: Refs) => {
  return `${parseSchema(omit(schema, 'nullable'), refs, true)}.nullable()`
}
