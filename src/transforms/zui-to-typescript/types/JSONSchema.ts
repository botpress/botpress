import { type JSONSchema4, type JSONSchema4Type, type JSONSchema4TypeName } from 'json-schema'
import memoize from 'lodash/memoize'
import isPlainObject from 'lodash/isPlainObject'

export type SchemaType =
  | 'ALL_OF'
  | 'UNNAMED_SCHEMA'
  | 'ANY'
  | 'ANY_OF'
  | 'BOOLEAN'
  | 'NAMED_ENUM'
  | 'NAMED_SCHEMA'
  | 'NEVER'
  | 'NULL'
  | 'NUMBER'
  | 'STRING'
  | 'OBJECT'
  | 'ONE_OF'
  | 'TYPED_ARRAY'
  | 'REFERENCE'
  | 'UNION'
  | 'UNNAMED_ENUM'
  | 'UNTYPED_ARRAY'
  | 'CUSTOM_TYPE'

export type JSONSchemaTypeName = JSONSchema4TypeName
export type JSONSchemaType = JSONSchema4Type

export interface JSONSchema extends JSONSchema4 {
  /**
   * schema extension to support numeric enums
   */
  tsEnumNames?: string[]
  /**
   * schema extension to support custom types
   */
  tsType?: string
  /**
   * property exists at least in https://json-schema.org/draft/2019-09/json-schema-validation.html#rfc.section.9.3
   */
  deprecated?: boolean
}

export const Parent = Symbol('Parent')

export interface LinkedJSONSchema extends JSONSchema {
  /**
   * A reference to this schema's parent node, for convenience.
   * `null` when this is the root schema.
   */
  [Parent]: LinkedJSONSchema | null

  additionalItems?: boolean | LinkedJSONSchema
  additionalProperties?: boolean | LinkedJSONSchema
  items?: LinkedJSONSchema | LinkedJSONSchema[]
  definitions?: {
    [k: string]: LinkedJSONSchema
  }
  properties?: {
    [k: string]: LinkedJSONSchema
  }
  patternProperties?: {
    [k: string]: LinkedJSONSchema
  }
  dependencies?: {
    [k: string]: LinkedJSONSchema | string[]
  }
  allOf?: LinkedJSONSchema[]
  anyOf?: LinkedJSONSchema[]
  oneOf?: LinkedJSONSchema[]
  not?: LinkedJSONSchema
}

export interface NormalizedJSONSchema extends LinkedJSONSchema {
  additionalItems?: boolean | NormalizedJSONSchema
  additionalProperties: boolean | NormalizedJSONSchema
  extends?: string[]
  items?: NormalizedJSONSchema | NormalizedJSONSchema[]
  $defs?: {
    [k: string]: NormalizedJSONSchema
  }
  properties?: {
    [k: string]: NormalizedJSONSchema
  }
  patternProperties?: {
    [k: string]: NormalizedJSONSchema
  }
  dependencies?: {
    [k: string]: NormalizedJSONSchema | string[]
  }
  allOf?: NormalizedJSONSchema[]
  anyOf?: NormalizedJSONSchema[]
  oneOf?: NormalizedJSONSchema[]
  not?: NormalizedJSONSchema
  required: string[]

  // Removed by normalizer
  definitions: never
  id: never
}

export interface EnumJSONSchema extends NormalizedJSONSchema {
  enum: any[]
}

export interface NamedEnumJSONSchema extends NormalizedJSONSchema {
  tsEnumNames: string[]
}

export interface SchemaSchema extends NormalizedJSONSchema {
  properties: {
    [k: string]: NormalizedJSONSchema
  }
  required: string[]
}

export interface JSONSchemaWithDefinitions extends NormalizedJSONSchema {
  $defs: {
    [k: string]: NormalizedJSONSchema
  }
}

export interface CustomTypeJSONSchema extends NormalizedJSONSchema {
  tsType: string
}

export const getRootSchema = memoize((schema: LinkedJSONSchema): LinkedJSONSchema => {
  const parent = schema[Parent]
  if (!parent) {
    return schema
  }
  return getRootSchema(parent)
})

export function isBoolean(schema: LinkedJSONSchema | JSONSchemaType): schema is boolean {
  return schema === true || schema === false
}

export function isPrimitive(schema: LinkedJSONSchema | JSONSchemaType): schema is JSONSchemaType {
  return !isPlainObject(schema)
}

export function isCompound(schema: JSONSchema): boolean {
  return Array.isArray(schema.type) || 'anyOf' in schema || 'oneOf' in schema
}
