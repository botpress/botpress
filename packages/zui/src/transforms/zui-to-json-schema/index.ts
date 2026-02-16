import z from '../../z'
import { util } from '../../z/types/utils'
import * as err from '../common/errors'
import * as json from '../common/json-schema'
import { zodArrayToJsonArray } from './type-processors/array'
import { zodNumberToJsonNumber } from './type-processors/number'
import { zodSetToJsonSet } from './type-processors/set'
import { zodStringToJsonString } from './type-processors/string'
import { zodTupleToJsonTuple } from './type-processors/tuple'

/**
 * Converts a Zui schema to a ZUI flavored JSON schema.
 * @param schema zui schema
 * @returns ZUI flavored JSON schema
 */
export function toJSONSchema(schema: z.Schema): json.Schema {
  const s = schema as z.ZodNativeSchema

  switch (s.typeName) {
    case 'ZodString':
      return zodStringToJsonString(s) satisfies json.StringSchema

    case 'ZodNumber':
      return zodNumberToJsonNumber(s) satisfies json.NumberSchema

    case 'ZodNaN':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodNaN')

    case 'ZodBigInt':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodBigInt', {
        suggestedAlternative: 'serialize bigint to string',
      })

    case 'ZodBoolean':
      return {
        type: 'boolean',
        description: s.description,
        'x-zui': s._def['x-zui'],
      } satisfies json.BooleanSchema

    case 'ZodDate':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodDate', {
        suggestedAlternative: 'use z.string().datetime() instead',
      })

    case 'ZodUndefined':
      return undefinedSchema(s)

    case 'ZodNull':
      return nullSchema(s)

    case 'ZodAny':
      return {
        description: s.description,
        'x-zui': s._def['x-zui'],
      } satisfies json.AnySchema

    case 'ZodUnknown':
      return {
        description: s.description,
        'x-zui': { ...s._def['x-zui'], def: { typeName: 'ZodUnknown' } },
      }

    case 'ZodNever':
      return {
        not: true,
        description: s.description,
        'x-zui': s._def['x-zui'],
      } satisfies json.NeverSchema

    case 'ZodVoid':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodVoid')

    case 'ZodArray':
      return zodArrayToJsonArray(s, toJSONSchema) satisfies json.ArraySchema

    case 'ZodObject':
      const shape = Object.entries(s.shape)
      const requiredProperties = shape.filter(([_, value]) => !value.isOptional())
      const required = requiredProperties.length ? requiredProperties.map(([key]) => key) : undefined
      const properties = shape
        .map(([key, value]) => [key, value.mandatory()] satisfies [string, z.ZodType])
        .map(([key, value]) => [key, toJSONSchema(value)] satisfies [string, json.Schema])

      let additionalProperties: json.ObjectSchema['additionalProperties'] = false
      if (s._def.unknownKeys instanceof z.ZodType) {
        additionalProperties = toJSONSchema(s._def.unknownKeys)
      } else if (s._def.unknownKeys === 'passthrough') {
        additionalProperties = true
      }

      return {
        type: 'object',
        description: s.description,
        properties: Object.fromEntries(properties),
        required,
        additionalProperties,
        'x-zui': s._def['x-zui'],
      } satisfies json.ObjectSchema

    case 'ZodUnion':
      return {
        description: s.description,
        anyOf: s.options.map((option) => toJSONSchema(option)),
        'x-zui': s._def['x-zui'],
      } satisfies json.UnionSchema

    case 'ZodDiscriminatedUnion':
      return {
        description: s.description,
        anyOf: s.options.map((option) => toJSONSchema(option)),
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodDiscriminatedUnion', discriminator: s.discriminator },
        },
      } satisfies json.DiscriminatedUnionSchema

    case 'ZodIntersection':
      const left = toJSONSchema(s._def.left)
      const right = toJSONSchema(s._def.right)

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
        description: s.description,
        allOf: [left, right],
        'x-zui': s._def['x-zui'],
      } satisfies json.IntersectionSchema

    case 'ZodTuple':
      return zodTupleToJsonTuple(s, toJSONSchema) satisfies json.TupleSchema

    case 'ZodRecord':
      return {
        type: 'object',
        description: s.description,
        additionalProperties: toJSONSchema(s._def.valueType),
        'x-zui': s._def['x-zui'],
      } satisfies json.RecordSchema

    case 'ZodMap':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodMap')

    case 'ZodSet':
      return zodSetToJsonSet(s, toJSONSchema) satisfies json.SetSchema

    case 'ZodFunction':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodFunction')

    case 'ZodLazy':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodLazy')

    case 'ZodLiteral':
      if (typeof s.value === 'string') {
        return {
          type: 'string',
          description: s.description,
          const: s.value,
          'x-zui': s._def['x-zui'],
        } satisfies json.LiteralStringSchema
      } else if (typeof s.value === 'number') {
        return {
          type: 'number',
          description: s.description,
          const: s.value,
          'x-zui': s._def['x-zui'],
        } satisfies json.LiteralNumberSchema
      } else if (typeof s.value === 'boolean') {
        return {
          type: 'boolean',
          description: s.description,
          const: s.value,
          'x-zui': s._def['x-zui'],
        } satisfies json.LiteralBooleanSchema
      } else if (s.value === null) {
        return nullSchema(s._def)
      } else if (s.value === undefined) {
        return undefinedSchema(s._def)
      } else {
        util.assertEqual<bigint | symbol, typeof s.value>(true)
        const unsupportedLiteral = typeof s.value
        throw new err.ZuiToJSONSchemaError(`Unsupported literal type: "${unsupportedLiteral}"`)
      }

    case 'ZodEnum':
      return {
        type: 'string',
        description: s.description,
        enum: s._def.values,
        'x-zui': s._def['x-zui'],
      } satisfies json.EnumSchema

    case 'ZodEffects':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodEffects')

    case 'ZodNativeEnum':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodNativeEnum')

    case 'ZodOptional':
      return {
        description: s.description,
        anyOf: [toJSONSchema(s._def.innerType), undefinedSchema()],
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodOptional' },
        },
      } satisfies json.OptionalSchema

    case 'ZodNullable':
      return {
        anyOf: [toJSONSchema(s._def.innerType), nullSchema()],
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodNullable' },
        },
      } satisfies json.NullableSchema

    case 'ZodDefault':
      // ZodDefault is not treated as a metadata root so we don't need to preserve x-zui
      return {
        ...toJSONSchema(s._def.innerType),
        default: s._def.defaultValue(),
      }

    case 'ZodCatch':
      // TODO: could be supported using if-else json schema
      throw new err.UnsupportedZuiToJSONSchemaError('ZodCatch')

    case 'ZodPromise':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodPromise')

    case 'ZodBranded':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodBranded')

    case 'ZodPipeline':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodPipeline')

    case 'ZodSymbol':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodPipeline')

    case 'ZodReadonly':
      // ZodReadonly is not treated as a metadata root so we don't need to preserve x-zui
      return {
        ...toJSONSchema(s._def.innerType),
        readOnly: true,
      }

    case 'ZodRef':
      return {
        $ref: s._def.uri,
        description: s.description,
        'x-zui': s._def['x-zui'],
      }

    default:
      util.assertNever(s)
  }
}

const undefinedSchema = (def?: z.ZodTypeDef): json.UndefinedSchema => ({
  not: true,
  description: def?.description,
  'x-zui': { ...def?.['x-zui'], def: { typeName: 'ZodUndefined' } },
})

const nullSchema = (def?: z.ZodTypeDef): json.NullSchema => ({
  type: 'null',
  description: def?.description,
  'x-zui': def?.['x-zui'],
})
