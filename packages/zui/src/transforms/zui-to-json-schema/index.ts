import * as utils from '../../utils'
import * as z from '../../z'
import * as err from '../common/errors'
import * as json from '../common/json-schema'
import { zodArrayToJsonArray } from './type-processors/array'
import { zodNumberToJsonNumber } from './type-processors/number'
import { zodSetToJsonSet } from './type-processors/set'
import { zodStringToJsonString } from './type-processors/string'
import { zodTupleToJsonTuple } from './type-processors/tuple'

export type JSONSchemaUnionStrategy = 'oneOf' | 'anyOf'

/**
 * @description Options for JSON schema generation.
 */
export type JSONSchemaGenerationOptions = {
  /**
   * @default 'anyOf' for unions, 'oneOf' for discriminated unions
   */
  unionStrategy: JSONSchemaUnionStrategy

  /**
   * @default true
   * @description Whether to include the discriminator property in the generated JSON schema for discriminated unions. This property is not part of the JSON schema specification but is used by some tools to optimize validation and code generation for discriminated unions. If set to false, the discriminator property will be omitted from the generated JSON schema.
   */
  discriminator: boolean
}

const DEFAULT_UNION_STRATEGY = 'anyOf' satisfies JSONSchemaUnionStrategy
const DEFAULT_DISCRIMINATED_UNION_STRATEGY = 'oneOf' satisfies JSONSchemaUnionStrategy
const DEFAULT_DISCRIMINATOR_OPTION = true

/**
 * Converts a Zui schema to a ZUI flavored JSON schema.
 * @param schema zui schema
 * @returns ZUI flavored JSON schema
 */
export function toJSONSchema(schema: z.ZodType, opts: Partial<JSONSchemaGenerationOptions> = {}): json.Schema {
  const s = schema as z.ZodNativeType

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
      return zodArrayToJsonArray(s, (i) => toJSONSchema(i, opts)) satisfies json.ArraySchema

    case 'ZodObject':
      const shape = Object.entries(s.shape)
      const requiredProperties = shape.filter(([_, value]) => !value.isOptional())
      const required = requiredProperties.length ? requiredProperties.map(([key]) => key) : undefined
      const properties = shape
        .map(([key, value]) => [key, value.mandatory()] satisfies [string, z.ZodType])
        .map(([key, value]) => [key, toJSONSchema(value, opts)] satisfies [string, json.Schema])

      return {
        type: 'object',
        description: s.description,
        properties: Object.fromEntries(properties),
        required,
        additionalProperties: additionalPropertiesSchema(s._def, opts),
        'x-zui': s._def['x-zui'],
      } satisfies json.ObjectSchema

    case 'ZodUnion':
      const unionStrategy = opts.unionStrategy ?? DEFAULT_UNION_STRATEGY
      if (unionStrategy === 'oneOf') {
        return {
          description: s.description,
          oneOf: s.options.map((option) => toJSONSchema(option, opts)),
          'x-zui': s._def['x-zui'],
        } satisfies json.UnionSchema
      }
      return {
        description: s.description,
        anyOf: s.options.map((option) => toJSONSchema(option, opts)),
        'x-zui': s._def['x-zui'],
      } satisfies json.UnionSchema

    case 'ZodDiscriminatedUnion':
      const discriminatedUnionStrategy = opts.unionStrategy ?? DEFAULT_DISCRIMINATED_UNION_STRATEGY
      const discriminatorOption = opts.discriminator ?? DEFAULT_DISCRIMINATOR_OPTION
      const discriminator = discriminatorOption ? { propertyName: s.discriminator } : undefined
      if (discriminatedUnionStrategy === 'oneOf') {
        return {
          description: s.description,
          oneOf: s.options.map((option) => toJSONSchema(option, opts)),
          discriminator,
          'x-zui': {
            ...s._def['x-zui'],
            def: { typeName: 'ZodDiscriminatedUnion', discriminator: s.discriminator },
          },
        } satisfies json.DiscriminatedUnionSchema
      }
      return {
        description: s.description,
        anyOf: s.options.map((option) => toJSONSchema(option, opts)),
        discriminator,
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodDiscriminatedUnion', discriminator: s.discriminator },
        },
      } satisfies json.DiscriminatedUnionSchema

    case 'ZodIntersection':
      const left = toJSONSchema(s._def.left, opts)
      const right = toJSONSchema(s._def.right, opts)

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
      return zodTupleToJsonTuple(s, (i) => toJSONSchema(i, opts)) satisfies json.TupleSchema

    case 'ZodRecord':
      return {
        type: 'object',
        description: s.description,
        additionalProperties: toJSONSchema(s._def.valueType, opts),
        'x-zui': s._def['x-zui'],
      } satisfies json.RecordSchema

    case 'ZodMap':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodMap')

    case 'ZodSet':
      return zodSetToJsonSet(s, (i) => toJSONSchema(i, opts)) satisfies json.SetSchema

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
        s.value satisfies bigint | symbol
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
        anyOf: [toJSONSchema(s._def.innerType, opts), undefinedSchema()],
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodOptional' },
        },
      } satisfies json.OptionalSchema

    case 'ZodNullable':
      return {
        anyOf: [toJSONSchema(s._def.innerType, opts), nullSchema()],
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodNullable' },
        },
      } satisfies json.NullableSchema

    case 'ZodDefault':
      // ZodDefault is not treated as a metadata root so we don't need to preserve x-zui
      return {
        ...toJSONSchema(s._def.innerType, opts),
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
        ...toJSONSchema(s._def.innerType, opts),
        readOnly: true,
      }

    case 'ZodRef':
      return {
        $ref: s._def.uri,
        description: s.description,
        'x-zui': s._def['x-zui'],
      }

    default:
      utils.assert.assertNever(s)
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

const additionalPropertiesSchema = (
  def: z.ZodObjectDef,
  opts: Partial<JSONSchemaGenerationOptions>
): NonNullable<json.ObjectSchema['additionalProperties']> => {
  if (def.unknownKeys === 'passthrough') {
    return true
  }

  if (def.unknownKeys === 'strict') {
    return false
  }

  if (!z.is.zuiType(def.unknownKeys)) {
    return false
  }

  if (def.unknownKeys.typeName === 'ZodNever') {
    return false
  }

  return toJSONSchema(def.unknownKeys, opts)
}
