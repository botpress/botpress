import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { PropertyPath } from '../../utils/property-path-utils'
import * as z from '../../z'
import * as errors from '../common/errors'
import { ArraySchema, SetSchema, TupleSchema } from '../common/json-schema'
import * as guards from './guards'
import { arrayJSONSchemaToZuiArray } from './iterables/array'
import { toZuiPrimitive } from './primitives'

const DEFAULT_TYPE = z.any()

/**
 * Converts a JSON Schema to a ZUI Schema.
 * @param schema json schema
 * @returns ZUI Schema
 */
export function fromJSONSchema(schema: JSONSchema7): z.ZodType {
  return _fromJSONSchema(schema, new PropertyPath())
}

function _fromJSONSchema(schema: JSONSchema7Definition | undefined, path: PropertyPath): z.ZodType {
  if (schema === undefined) {
    return DEFAULT_TYPE
  }

  if (schema === true) {
    return z.any()
  }

  if (schema === false) {
    return z.never()
  }

  if (schema.default !== undefined) {
    const inner = _fromJSONSchema({ ...schema, default: undefined }, path)
    return inner.default(schema.default)
  }
  if (schema.readOnly) {
    const inner = _fromJSONSchema({ ...schema, readOnly: undefined }, path)
    return inner.readonly()
  }
  if (schema.description !== undefined) {
    const inner = _fromJSONSchema({ ...schema, description: undefined }, path)
    return inner.describe(schema.description)
  }

  if (schema.patternProperties !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ patternProperties: schema.patternProperties }, path.toString())
  }

  if (schema.propertyNames !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ propertyNames: schema.propertyNames }, path.toString())
  }

  if (schema.if !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ if: schema.if }, path.toString())
  }

  if (schema.then !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ then: schema.then }, path.toString())
  }

  if (schema.else !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ else: schema.else }, path.toString())
  }

  if (schema.$ref !== undefined) {
    return z.ref(schema.$ref)
  }

  if (schema.not !== undefined) {
    if (guards.isUndefinedSchema(schema)) {
      return z.undefined()
    }
    if (schema.not === true) {
      return z.never()
    }
    throw new errors.UnsupportedJSONSchemaToZuiError({ not: schema.not }, path.toString())
  }

  if (Array.isArray(schema.type)) {
    if (schema.type.length === 0) {
      return DEFAULT_TYPE
    }
    if (schema.type.length === 1) {
      return _fromJSONSchema({ ...schema, type: schema.type[0] }, path)
    }
    const { type: _, ...tmp } = schema
    const types = schema.type.map((t, index) =>
      _fromJSONSchema({ ...tmp, type: t }, path.withIndexType('number', index))
    ) as [z.ZodType, z.ZodType, ...z.ZodType[]]
    return z.union(types)
  }

  if (schema.type === 'string') {
    if (schema.enum && schema.enum.length > 0) {
      return z.enum(schema.enum as [string, ...string[]])
    }
    return toZuiPrimitive('string', schema, path)
  }

  if (schema.type === 'integer') {
    const zSchema = toZuiPrimitive('number', schema, path)
    if (zSchema.typeName === 'ZodNumber') {
      return zSchema.int()
    }

    return zSchema
  }

  if (schema.type === 'number') {
    return toZuiPrimitive('number', schema, path)
  }

  if (schema.type === 'boolean') {
    return toZuiPrimitive('boolean', schema, path)
  }

  if (schema.type === 'null') {
    return toZuiPrimitive('null', schema, path)
  }

  if (schema.type === 'array') {
    return arrayJSONSchemaToZuiArray(schema as ArraySchema | TupleSchema | SetSchema, _fromJSONSchema, path)
  }

  if (schema.type === 'object') {
    if (schema.additionalProperties !== undefined && schema.properties !== undefined) {
      const catchAll = _fromJSONSchema(schema.additionalProperties, path.withIndexType('string'))
      const inner = _fromJSONSchema({ ...schema, additionalProperties: undefined }, path) as z.ZodObject
      return inner.catchall(catchAll)
    }

    if (schema.properties !== undefined) {
      const properties: Record<string, z.ZodType> = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        const mapped: z.ZodType = _fromJSONSchema(value, path.withIndexType('key', key))
        const required: string[] = schema.required ?? []
        // If the property is already optional (e.g., has a default value), don't wrap it again
        properties[key] = required.includes(key) ? mapped : mapped.isOptional() ? mapped : mapped.optional()
      }
      return z.object(properties)
    }

    if (schema.additionalProperties !== undefined) {
      const inner = _fromJSONSchema(schema.additionalProperties, path.withIndexType('string'))
      return z.record(inner)
    }

    return z.record(DEFAULT_TYPE)
  }

  if (schema.anyOf !== undefined) {
    if (schema.anyOf.length === 0) {
      return DEFAULT_TYPE
    }

    if (schema.anyOf.length === 1) {
      return _fromJSONSchema(schema.anyOf[0], path)
    }

    if (guards.isOptionalSchema(schema)) {
      const inner = _fromJSONSchema(schema.anyOf[0], path)
      return inner.optional()
    }

    if (guards.isNullableSchema(schema)) {
      const inner = _fromJSONSchema(schema.anyOf[0], path)
      return inner.nullable()
    }

    if (guards.isDiscriminatedUnionSchema(schema) && schema['x-zui']?.def?.discriminator) {
      const { discriminator } = schema['x-zui'].def
      const options = schema.anyOf.map((s, index) => _fromJSONSchema(s, path.withIndexType('number', index))) as [
        z.ZodDiscriminatedUnionOption<string>,
        z.ZodDiscriminatedUnionOption<string>,
        ...z.ZodDiscriminatedUnionOption<string>[],
      ]
      return z.discriminatedUnion(discriminator, options)
    }

    const options = schema.anyOf.map((s, index) => _fromJSONSchema(s, path.withIndexType('number', index))) as [
      z.ZodType,
      z.ZodType,
      ...z.ZodType[],
    ]
    return z.union(options)
  }

  if (schema.oneOf !== undefined) {
    if (schema.oneOf.length === 0) {
      return DEFAULT_TYPE
    }

    if (schema.oneOf.length === 1) {
      return _fromJSONSchema(schema.oneOf[0], path)
    }

    if (guards.isExclusiveDiscriminatedUnionSchema(schema)) {
      const discriminator = schema.discriminator?.propertyName || schema['x-zui']?.def?.discriminator
      if (discriminator) {
        const options = schema.oneOf.map((s, index) => _fromJSONSchema(s, path.withIndexType('number', index))) as [
          z.ZodDiscriminatedUnionOption<string>,
          z.ZodDiscriminatedUnionOption<string>,
          ...z.ZodDiscriminatedUnionOption<string>[],
        ]
        return z.discriminatedUnion(discriminator, options)
      }
    }

    const options = schema.oneOf.map((s, index) => _fromJSONSchema(s, path.withIndexType('number', index))) as [
      z.ZodType,
      z.ZodType,
      ...z.ZodType[],
    ]
    return z.union(options)
  }

  if (schema.allOf !== undefined) {
    if (schema.allOf.length === 0) {
      return DEFAULT_TYPE
    }
    if (schema.allOf.length === 1) {
      return _fromJSONSchema(schema.allOf[0], path)
    }
    const schemas = schema.allOf as [JSONSchema7, JSONSchema7, ...JSONSchema7[]]
    const zSchemas = schemas.map((s, index) => _fromJSONSchema(s, path.withIndexType('number', index)))
    return zSchemas
      .slice(2)
      .reduce<z.ZodType>((acc, s) => z.intersection(acc, s), z.intersection(zSchemas[0]!, zSchemas[1]!))
  }

  schema.type satisfies undefined

  if (guards.isUnknownSchema(schema)) {
    return z.unknown()
  }
  return DEFAULT_TYPE
}
