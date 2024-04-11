import isPlainObject from 'lodash/isPlainObject'
import { isCompound, type JSONSchema, type SchemaType } from './types/JSONSchema'

/**
 * Duck types a JSONSchema schema or property to determine which kind of AST node to parse it into.
 *
 * Due to what some might say is an oversight in the JSON-Schema spec, a given schema may
 * implicitly be an *intersection* of multiple JSON-Schema directives (ie. multiple TypeScript
 * types). The spec leaves it up to implementations to decide what to do with this
 * loosely-defined behavior.
 */
export function typesOfSchema(schema: JSONSchema): readonly [SchemaType, ...SchemaType[]] {
  // tsType is an escape hatch that supercedes all other directives
  if (schema.tsType) {
    return ['CUSTOM_TYPE']
  }

  // Collect matched types
  const matchedTypes: SchemaType[] = []
  for (const [schemaType, f] of Object.entries(matchers)) {
    if (f(schema)) {
      matchedTypes.push(schemaType as SchemaType)
    }
  }

  // Default to an unnamed schema
  if (!matchedTypes.length) {
    return ['UNNAMED_SCHEMA']
  }

  return matchedTypes as [SchemaType, ...SchemaType[]]
}

const matchers: Record<SchemaType, (schema: JSONSchema) => boolean> = {
  ALL_OF(schema) {
    return 'allOf' in schema
  },
  ANY(schema) {
    if (Object.keys(schema).length === 0) {
      // The empty schema {} validates any value
      // @see https://json-schema.org/draft-07/json-schema-core.html#rfc.section.4.3.1
      return true
    }
    return schema.type === 'any'
  },
  ANY_OF(schema) {
    return 'anyOf' in schema
  },
  BOOLEAN(schema) {
    if ('enum' in schema) {
      return false
    }
    if (schema.type === 'boolean') {
      return true
    }
    if (!isCompound(schema) && typeof schema.default === 'boolean') {
      return true
    }
    return false
  },
  CUSTOM_TYPE() {
    return false // Explicitly handled before we try to match
  },
  NAMED_ENUM(schema) {
    return 'enum' in schema && 'tsEnumNames' in schema
  },
  NAMED_SCHEMA(schema) {
    // 8.2.1. The presence of "$id" in a subschema indicates that the subschema constitutes a distinct schema resource within a single schema document.
    return '$id' in schema && ('patternProperties' in schema || 'properties' in schema)
  },
  NEVER(schema: JSONSchema | boolean) {
    return schema === false
  },
  NULL(schema) {
    return schema.type === 'null'
  },
  NUMBER(schema) {
    if ('enum' in schema) {
      return false
    }
    if (schema.type === 'integer' || schema.type === 'number') {
      return true
    }
    if (!isCompound(schema) && typeof schema.default === 'number') {
      return true
    }
    return false
  },
  OBJECT(schema) {
    return (
      schema.type === 'object' &&
      !isPlainObject(schema.additionalProperties) &&
      !schema.allOf &&
      !schema.anyOf &&
      !schema.oneOf &&
      !schema.patternProperties &&
      !schema.properties &&
      !schema.required
    )
  },
  ONE_OF(schema) {
    return 'oneOf' in schema
  },
  REFERENCE(schema) {
    return '$ref' in schema
  },
  STRING(schema) {
    if ('enum' in schema) {
      return false
    }
    if (schema.type === 'string') {
      return true
    }
    if (!isCompound(schema) && typeof schema.default === 'string') {
      return true
    }
    return false
  },
  TYPED_ARRAY(schema) {
    if (schema.type && schema.type !== 'array') {
      return false
    }
    return 'items' in schema
  },
  UNION(schema) {
    return Array.isArray(schema.type)
  },
  UNNAMED_ENUM(schema) {
    if ('tsEnumNames' in schema) {
      return false
    }
    if (
      schema.type &&
      schema.type !== 'boolean' &&
      schema.type !== 'integer' &&
      schema.type !== 'number' &&
      schema.type !== 'string'
    ) {
      return false
    }
    return 'enum' in schema
  },
  UNNAMED_SCHEMA() {
    return false // Explicitly handled as the default case
  },
  UNTYPED_ARRAY(schema) {
    return schema.type === 'array' && !('items' in schema)
  },
}
