import { ZuiExtensionObject } from '../../ui/types'
import z from '../../z'
import * as json from '../common/json-schema'
import * as err from '../common/errors'
import { zodNumberToJsonNumber } from './type-processors/number'
import { zodStringToJsonString } from './type-processors/string'

/**
 * # \#\#\# Experimental \#\#\#
 *
 * @experimental This function is experimental and is subject to breaking changes in the future.
 * @param schema zui schema
 * @returns ZUI flavored JSON schema
 */
export function toJsonSchema(schema: z.Schema): json.ZuiJsonSchema {
  const schemaTyped = schema as z.ZodFirstPartySchemaTypes
  const def = schemaTyped._def

  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return zodStringToJsonString(schemaTyped as z.ZodString) satisfies json.StringSchema

    case z.ZodFirstPartyTypeKind.ZodNumber:
      return zodNumberToJsonNumber(schemaTyped as z.ZodNumber) satisfies json.NumberSchema

    case z.ZodFirstPartyTypeKind.ZodNaN:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodNaN)

    case z.ZodFirstPartyTypeKind.ZodBigInt:
      return {
        type: 'integer',
        'x-zui': {
          ...def['x-zui'],
          def: { typeName: z.ZodFirstPartyTypeKind.ZodBigInt },
        },
      } satisfies json.BigIntSchema

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return { type: 'boolean', 'x-zui': def['x-zui'] } satisfies json.BooleanSchema

    case z.ZodFirstPartyTypeKind.ZodDate:
      return {
        type: 'string',
        format: 'date-time',
        'x-zui': {
          ...def['x-zui'],
          def: { typeName: z.ZodFirstPartyTypeKind.ZodDate },
        },
      } satisfies json.DateSchema

    case z.ZodFirstPartyTypeKind.ZodUndefined:
      return undefinedSchema(def['x-zui'])

    case z.ZodFirstPartyTypeKind.ZodNull:
      return nullSchema(def['x-zui'])

    case z.ZodFirstPartyTypeKind.ZodAny:
      return { 'x-zui': def['x-zui'] } satisfies json.AnySchema

    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return {
        'x-zui': { ...def['x-zui'], def: { typeName: z.ZodFirstPartyTypeKind.ZodUnknown } },
      }

    case z.ZodFirstPartyTypeKind.ZodNever:
      return {
        not: true,
        'x-zui': def['x-zui'],
      } satisfies json.NeverSchema

    case z.ZodFirstPartyTypeKind.ZodVoid:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodVoid)

    case z.ZodFirstPartyTypeKind.ZodArray:
      return {
        type: 'array',
        items: toJsonSchema(def.type),
        'x-zui': def['x-zui'],
      } satisfies json.ArraySchema

    case z.ZodFirstPartyTypeKind.ZodObject:
      const shape = Object.entries(def.shape())
      const required = shape.filter(([_, value]) => !value.isOptional()).map(([key]) => key)
      const properties = shape
        .map(([key, value]) => [key, _toRequired(value)] satisfies [string, z.ZodType])
        .map(([key, value]) => [key, toJsonSchema(value)] satisfies [string, json.ZuiJsonSchema])

      // TODO: ensure unknownKeys and catchall are not lost

      return {
        type: 'object',
        properties: Object.fromEntries(properties),
        required,
        'x-zui': def['x-zui'],
      } satisfies json.ObjectSchema

    case z.ZodFirstPartyTypeKind.ZodUnion:
      return {
        anyOf: def.options.map((option) => toJsonSchema(option)),
        'x-zui': def['x-zui'],
      } satisfies json.UnionSchema

    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return {
        anyOf: def.options.map((option) => toJsonSchema(option)),
        'x-zui': {
          ...def['x-zui'],
          def: { typeName: z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion, discriminator: def.discriminator },
        },
      } satisfies json.DiscriminatedUnionSchema

    case z.ZodFirstPartyTypeKind.ZodIntersection:
      return {
        allOf: [toJsonSchema(def.left), toJsonSchema(def.right)],
        'x-zui': def['x-zui'],
      } satisfies json.IntersectionSchema

    case z.ZodFirstPartyTypeKind.ZodTuple:
      return {
        type: 'array',
        items: def.items.map((item) => toJsonSchema(item)),
        additionalItems: def.rest ? toJsonSchema(def.rest) : undefined,
        'x-zui': def['x-zui'],
      } satisfies json.TupleSchema

    case z.ZodFirstPartyTypeKind.ZodRecord:
      return {
        type: 'object',
        additionalProperties: toJsonSchema(def.valueType),
        'x-zui': def['x-zui'],
      } satisfies json.RecordSchema

    case z.ZodFirstPartyTypeKind.ZodMap:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodMap)

    case z.ZodFirstPartyTypeKind.ZodSet:
      return {
        type: 'array',
        items: toJsonSchema(def.valueType),
        uniqueItems: true,
        'x-zui': def['x-zui'],
      } satisfies json.SetSchema

    case z.ZodFirstPartyTypeKind.ZodFunction:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodFunction)

    case z.ZodFirstPartyTypeKind.ZodLazy:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodLazy)

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      if (typeof def.value === 'string') {
        return {
          type: 'string',
          const: def.value,
          'x-zui': def['x-zui'],
        } satisfies json.LiteralStringSchema
      } else if (typeof def.value === 'number') {
        return {
          type: 'number',
          const: def.value,
          'x-zui': def['x-zui'],
        } satisfies json.LiteralNumberSchema
      } else if (typeof def.value === 'boolean') {
        return {
          type: 'boolean',
          const: def.value,
          'x-zui': def['x-zui'],
        } satisfies json.LiteralBooleanSchema
      } else if (def.value === null) {
        return nullSchema(def['x-zui'])
      } else if (def.value === undefined) {
        return undefinedSchema(def['x-zui'])
      } else {
        z.util.assertEqual<bigint | symbol, typeof def.value>(true)
        const unsupportedLiteral = typeof def.value
        throw new err.ZuiToJsonSchemaError(`Unsupported literal type: "${unsupportedLiteral}"`)
      }

    case z.ZodFirstPartyTypeKind.ZodEnum:
      return {
        type: 'string',
        enum: def.values,
        'x-zui': def['x-zui'],
      } satisfies json.EnumSchema

    case z.ZodFirstPartyTypeKind.ZodEffects:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodEffects)

    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodNativeEnum)

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return {
        anyOf: [toJsonSchema(def.innerType), undefinedSchema()],
        'x-zui': {
          ...def['x-zui'],
          def: { typeName: z.ZodFirstPartyTypeKind.ZodOptional },
        },
      } satisfies json.OptionalSchema

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return {
        anyOf: [toJsonSchema(def.innerType), nullSchema()],
        'x-zui': {
          ...def['x-zui'],
          def: { typeName: z.ZodFirstPartyTypeKind.ZodNullable },
        },
      } satisfies json.NullableSchema

    case z.ZodFirstPartyTypeKind.ZodDefault:
      // ZodDefault is not treated as a metadata root so we don't need to preserve x-zui
      return {
        default: def.defaultValue(),
        ...toJsonSchema(def.innerType),
      }

    case z.ZodFirstPartyTypeKind.ZodCatch:
      // TODO: could be supported using if-else json schema
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodCatch)

    case z.ZodFirstPartyTypeKind.ZodPromise:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodPromise)

    case z.ZodFirstPartyTypeKind.ZodBranded:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodBranded)

    case z.ZodFirstPartyTypeKind.ZodPipeline:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodPipeline)

    case z.ZodFirstPartyTypeKind.ZodSymbol:
      throw new err.UnsupportedZuiToJsonSchemaError(z.ZodFirstPartyTypeKind.ZodPipeline)

    case z.ZodFirstPartyTypeKind.ZodReadonly:
      // ZodReadonly is not treated as a metadata root so we don't need to preserve x-zui
      return {
        readOnly: true,
        ...toJsonSchema(def.innerType),
      }

    case z.ZodFirstPartyTypeKind.ZodRef:
      return {
        $ref: def.uri,
        'x-zui': def['x-zui'],
      }

    default:
      z.util.assertNever(def)
  }
}

/**
 * Make the schema required.
 * If this schema is already non-optional, it will return itself.
 * If this schema is optional, it will try to remove all optional constraints from the schema
 */
const _toRequired = (schema: z.ZodType): z.ZodType => {
  if (!schema.isOptional()) {
    return schema
  }

  let newSchema = schema as z.ZodFirstPartySchemaTypes
  const def = newSchema._def
  if (def.typeName === z.ZodFirstPartyTypeKind.ZodOptional) {
    newSchema = def.innerType
  }

  if (def.typeName === z.ZodFirstPartyTypeKind.ZodUnion) {
    const newOptions = def.options.filter((x) => x._def.typeName !== z.ZodFirstPartyTypeKind.ZodUndefined)
    if (newOptions.length === 1) {
      newSchema = newOptions[0] as z.ZodFirstPartySchemaTypes
    } else {
      type Options = [z.ZodType, z.ZodType, ...z.ZodType[]]
      newSchema = z.ZodUnion.create(newOptions as Options, def)
    }
  }

  return newSchema
}

const undefinedSchema = (xZui?: ZuiExtensionObject): json.UndefinedSchema => ({
  not: true,
  'x-zui': { ...xZui, def: { typeName: z.ZodFirstPartyTypeKind.ZodUndefined } },
})

const nullSchema = (xZui?: ZuiExtensionObject): json.NullSchema => ({
  type: 'null',
  'x-zui': xZui,
})
