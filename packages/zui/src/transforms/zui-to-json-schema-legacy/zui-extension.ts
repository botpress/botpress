import { z } from '../../z/index'
import { zodToJsonSchema } from './zodToJsonSchema'
import { Options } from './Options'
import { JSONSchema7 } from 'json-schema'

export type ZuiSchemaOptions = {
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
  zuiType: z.ZodTypeAny,
  opts: ZuiSchemaOptions = { target: 'openApi3' },
): JSONSchema7 => {
  const jsonSchema = zodToJsonSchema(zuiType as z.ZodType, opts)
  if (opts.$schemaUrl === false) {
    delete jsonSchema.$schema
  } else if (typeof opts.$schemaUrl === 'string') {
    jsonSchema.$schema = opts.$schemaUrl
  }

  return jsonSchema as JSONSchema7
}
