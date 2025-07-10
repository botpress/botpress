import z from '../../z'
import * as json from '../common/json-schema'
import * as err from '../common/errors'
import { zodNumberToJsonNumber } from './type-processors/number'
import { zodStringToJsonString } from './type-processors/string'
import { zodArrayToJsonArray } from './type-processors/array'
import { zodSetToJsonSet } from './type-processors/set'
import { zodTupleToJsonTuple } from './type-processors/tuple'

/**
 * Converts a Zui schema to a ZUI flavored JSON schema.
 * @param schema zui schema
 * @returns ZUI flavored JSON schema
 */
export function toJSONSchema(schema: z.Schema): json.Schema {
  const schemaTyped = schema as z.ZodFirstPartySchemaTypes
  const def = schemaTyped._def

  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return zodStringToJsonString(schemaTyped as z.ZodString) satisfies json.StringSchema

    case z.ZodFirstPartyTypeKind.ZodNumber:
      return zodNumberToJsonNumber(schemaTyped as z.ZodNumber) satisfies json.NumberSchema

    case z.ZodFirstPartyTypeKind.ZodNaN:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodNaN)

    case z.ZodFirstPartyTypeKind.ZodBigInt:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodBigInt, {
        suggestedAlternative: 'serialize bigint to string',
      })

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return {
        type: 'boolean',
        description: def.description,
        'x-zui': def['x-zui'],
      } satisfies json.BooleanSchema

    case z.ZodFirstPartyTypeKind.ZodDate:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodDate, {
        suggestedAlternative: 'use z.string().datetime() instead',
      })

    case z.ZodFirstPartyTypeKind.ZodUndefined:
      return undefinedSchema(def)

    case z.ZodFirstPartyTypeKind.ZodNull:
      return nullSchema(def)

    case z.ZodFirstPartyTypeKind.ZodAny:
      return {
        description: def.description,
        'x-zui': def['x-zui'],
      } satisfies json.AnySchema

    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return {
        description: def.description,
        'x-zui': { ...def['x-zui'], def: { typeName: z.ZodFirstPartyTypeKind.ZodUnknown } },
      }

    case z.ZodFirstPartyTypeKind.ZodNever:
      return {
        not: true,
        description: def.description,
        'x-zui': def['x-zui'],
      } satisfies json.NeverSchema

    case z.ZodFirstPartyTypeKind.ZodVoid:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodVoid)

    case z.ZodFirstPartyTypeKind.ZodArray:
      return zodArrayToJsonArray(schemaTyped as z.ZodArray, toJSONSchema) satisfies json.ArraySchema

    case z.ZodFirstPartyTypeKind.ZodObject:
      const shape = Object.entries(def.shape())
      const requiredProperties = shape.filter(([_, value]) => !value.isOptional())
      const required = requiredProperties.length ? requiredProperties.map(([key]) => key) : undefined
      const properties = shape
        .map(([key, value]) => [key, value.mandatory()] satisfies [string, z.ZodType])
        .map(([key, value]) => [key, toJSONSchema(value)] satisfies [string, json.Schema])

      let additionalProperties: json.ObjectSchema['additionalProperties'] = false
      if (def.unknownKeys instanceof z.ZodType) {
        additionalProperties = toJSONSchema(def.unknownKeys)
      } else if (def.unknownKeys === 'passthrough') {
        additionalProperties = true
      }

      return {
        type: 'object',
        description: def.description,
        properties: Object.fromEntries(properties),
        required,
        additionalProperties,
        'x-zui': def['x-zui'],
      } satisfies json.ObjectSchema

    case z.ZodFirstPartyTypeKind.ZodUnion:
      return {
        description: def.description,
        anyOf: def.options.map((option) => toJSONSchema(option)),
        'x-zui': def['x-zui'],
      } satisfies json.UnionSchema

    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return {
        description: def.description,
        anyOf: def.options.map((option) => toJSONSchema(option)),
        'x-zui': def['x-zui'],
      } satisfies json.UnionSchema

    case z.ZodFirstPartyTypeKind.ZodIntersection:
      const left = toJSONSchema(def.left)
      const right = toJSONSchema(def.right)

      /**
       * TODO: Potential conflict between `additionalProperties` in the left and right schemas.
       * To avoid this, we currently strip `additionalProperties` from both sides.
       * This is a workaround and results in lost schema information.
       * A proper fix would involve using `unevaluatedProperties`.
       * See: https://json-schema.org/understanding-json-schema/reference/object#unevaluatedproperties
       *
       * – fleur
       */
      if ('additionalProperties' in left) {
        delete left.additionalProperties
      }
      if ('additionalProperties' in right) {
        delete right.additionalProperties
      }

      return {
        description: def.description,
        allOf: [left, right],
        'x-zui': def['x-zui'],
      } satisfies json.IntersectionSchema

    case z.ZodFirstPartyTypeKind.ZodTuple:
      return zodTupleToJsonTuple(schemaTyped as z.ZodTuple, toJSONSchema) satisfies json.TupleSchema

    case z.ZodFirstPartyTypeKind.ZodRecord:
      return {
        type: 'object',
        description: def.description,
        additionalProperties: toJSONSchema(def.valueType),
        'x-zui': def['x-zui'],
      } satisfies json.RecordSchema

    case z.ZodFirstPartyTypeKind.ZodMap:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodMap)

    case z.ZodFirstPartyTypeKind.ZodSet:
      return zodSetToJsonSet(schemaTyped as z.ZodSet, toJSONSchema) satisfies json.SetSchema

    case z.ZodFirstPartyTypeKind.ZodFunction:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodFunction)

    case z.ZodFirstPartyTypeKind.ZodLazy:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodLazy)

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      if (typeof def.value === 'string') {
        return {
          type: 'string',
          description: def.description,
          const: def.value,
          'x-zui': def['x-zui'],
        } satisfies json.LiteralStringSchema
      } else if (typeof def.value === 'number') {
        return {
          type: 'number',
          description: def.description,
          const: def.value,
          'x-zui': def['x-zui'],
        } satisfies json.LiteralNumberSchema
      } else if (typeof def.value === 'boolean') {
        return {
          type: 'boolean',
          description: def.description,
          const: def.value,
          'x-zui': def['x-zui'],
        } satisfies json.LiteralBooleanSchema
      } else if (def.value === null) {
        return nullSchema(def)
      } else if (def.value === undefined) {
        return undefinedSchema(def)
      } else {
        z.util.assertEqual<bigint | symbol, typeof def.value>(true)
        const unsupportedLiteral = typeof def.value
        throw new err.ZuiToJSONSchemaError(`Unsupported literal type: "${unsupportedLiteral}"`)
      }

    case z.ZodFirstPartyTypeKind.ZodEnum:
      return {
        type: 'string',
        description: def.description,
        enum: def.values,
        'x-zui': def['x-zui'],
      } satisfies json.EnumSchema

    case z.ZodFirstPartyTypeKind.ZodEffects:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodEffects)

    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodNativeEnum)

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return {
        description: def.description,
        anyOf: [toJSONSchema(def.innerType), undefinedSchema()],
        'x-zui': {
          ...def['x-zui'],
          def: { typeName: z.ZodFirstPartyTypeKind.ZodOptional },
        },
      } satisfies json.OptionalSchema

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return {
        anyOf: [toJSONSchema(def.innerType), nullSchema()],
        'x-zui': {
          ...def['x-zui'],
          def: { typeName: z.ZodFirstPartyTypeKind.ZodNullable },
        },
      } satisfies json.NullableSchema

    case z.ZodFirstPartyTypeKind.ZodDefault:
      // ZodDefault is not treated as a metadata root so we don't need to preserve x-zui
      return {
        ...toJSONSchema(def.innerType),
        default: def.defaultValue(),
      }

    case z.ZodFirstPartyTypeKind.ZodCatch:
      // TODO: could be supported using if-else json schema
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodCatch)

    case z.ZodFirstPartyTypeKind.ZodPromise:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodPromise)

    case z.ZodFirstPartyTypeKind.ZodBranded:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodBranded)

    case z.ZodFirstPartyTypeKind.ZodPipeline:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodPipeline)

    case z.ZodFirstPartyTypeKind.ZodSymbol:
      throw new err.UnsupportedZuiToJSONSchemaError(z.ZodFirstPartyTypeKind.ZodPipeline)

    case z.ZodFirstPartyTypeKind.ZodReadonly:
      // ZodReadonly is not treated as a metadata root so we don't need to preserve x-zui
      return {
        ...toJSONSchema(def.innerType),
        readOnly: true,
      }

    case z.ZodFirstPartyTypeKind.ZodRef:
      return {
        $ref: def.uri,
        description: def.description,
        'x-zui': def['x-zui'],
      }

    default:
      z.util.assertNever(def)
  }
}

const undefinedSchema = (def?: z.ZodTypeDef): json.UndefinedSchema => ({
  not: true,
  description: def?.description,
  'x-zui': { ...def?.['x-zui'], def: { typeName: z.ZodFirstPartyTypeKind.ZodUndefined } },
})

const nullSchema = (def?: z.ZodTypeDef): json.NullSchema => ({
  type: 'null',
  description: def?.description,
  'x-zui': def?.['x-zui'],
})
