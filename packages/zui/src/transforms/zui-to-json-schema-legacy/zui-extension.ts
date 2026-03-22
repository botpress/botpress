import { JSONSchema7 } from 'json-schema'
import * as z from '../../z'
import { Options } from './Options'
import { zodToJsonSchema } from './zodToJsonSchema'

/**
 * @description Options for JSON schema generation.
 *  - Options passed directly to the `toJSONSchema` function are global to the whole schema.
 *  - When set at the schema creation, these options will apply to the current schema and all its children.
 *  - In a schema tree, lower level options will override higher level ones.
 */
export type JSONSchemaLegacyGenerationOptions = {
  /**
   * The scope is the full path to the property defined in the JSON schema, the root node being represented by #
   * Objects doesn't have any scope, only  its child does
   * @default "#/properties/"
   * */
  rootScope?: string
  /**
   * Sets the $schema path. If set to false, it will remove the $schema property from the schema
   */
  $schemaUrl?: string | false
  target?: 'jsonSchema7' | 'openApi3'
} & Partial<Pick<Options, 'unionStrategy' | 'discriminator'>>

/**
 * Converts a Zod schema to a JSON Schema.
 *
 * @deprecated Use the new toJSONSchema function instead.
 */
export const toJSONSchemaLegacy = (
  zuiType: z.ZodType,
  opts: JSONSchemaLegacyGenerationOptions = { target: 'openApi3' }
): JSONSchema7 => {
  const jsonSchema = zodToJsonSchema(zuiType, opts)
  if (opts.$schemaUrl === false) {
    delete jsonSchema.$schema
  } else if (typeof opts.$schemaUrl === 'string') {
    jsonSchema.$schema = opts.$schemaUrl
  }

  return jsonSchema as JSONSchema7
}
