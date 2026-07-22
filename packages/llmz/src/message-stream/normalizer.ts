import { transforms, type ZodObject } from '@bpinternal/zui'
import { isJsonSchema, isZuiSchema } from '../utils.js'
import {
  NAME_REGEX,
  type BodyFormat,
  type GenerativeComponentMetadata,
  type JsonSchema,
  type NormalizedComponentDefinition,
} from './types.js'

/**
 * User-facing component definition. Props may be declared with a ZUI/Zod object
 * schema or a plain JSON schema. Everything downstream of the normalizer
 * (parser, validator, instruction generator) is independent of ZUI/Zod.
 */
export type GenerativeComponentDefinition = {
  name: string
  description?: string
  props?: ZodObject<any> | JsonSchema
  body?: {
    type: BodyFormat
    description?: string
    required?: boolean
  }
  generation?: GenerativeComponentMetadata
}

const EMPTY_PROPS_SCHEMA: JsonSchema = { type: 'object', properties: {}, additionalProperties: false }

export const normalizeComponentName = (name: string): string => name.trim().toLowerCase()

export function normalizeComponentDefinition(definition: GenerativeComponentDefinition): NormalizedComponentDefinition {
  const name = normalizeComponentName(definition.name ?? '')

  if (!NAME_REGEX.test(name)) {
    throw new Error(
      `Invalid component name "${definition.name}". Component names must be lowercase ([a-z][a-z0-9_-]*).`
    )
  }

  return {
    name,
    description: definition.description,
    propsJsonSchema: normalizePropsSchema(definition.props, name),
    body: definition.body
      ? {
          format: definition.body.type,
          description: definition.body.description,
          required: definition.body.required ?? false,
        }
      : undefined,
    generation: definition.generation,
  }
}

export function normalizePropsSchema(props: ZodObject<any> | JsonSchema | undefined, name: string): JsonSchema {
  if (props === undefined) {
    return EMPTY_PROPS_SCHEMA
  }

  if (isZuiSchema(props)) {
    try {
      return transforms.toJSONSchema(props) as JsonSchema
    } catch {
      return transforms.toJSONSchemaLegacy(props) as JsonSchema
    }
  }

  if (isJsonSchema(props)) {
    return props
  }

  throw new Error(
    `Invalid props schema for "${name}". Expected a ZUI/Zod object schema or a JSON schema, but got type "${typeof props}".`
  )
}
