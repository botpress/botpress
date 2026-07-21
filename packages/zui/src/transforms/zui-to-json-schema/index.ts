import * as utils from '../../utils'
import { PropertyPath } from '../../utils/property-path-utils'
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
   * @default 'anyOf'
   */
  unionStrategy: JSONSchemaUnionStrategy

  /**
   * @default 'oneOf'
   */
  discriminatedUnionStrategy: JSONSchemaUnionStrategy

  /**
   * @default true
   * @description
   *  Whether to include the discriminator property in the generated JSON schema for discriminated unions.
   *  This property is not part of the JSON schema specification but is used by some tools to optimize validation and code generation for discriminated unions.
   *  If set to false, the discriminator property will be omitted from the generated JSON schema.
   *  Only affects the generated JSON schema when `discriminatedUnionStrategy` is set to 'oneOf'.
   *  For more details, see: https://ajv.js.org/guide/modifying-data.html#removing-additional-properties
   */
  discriminator: boolean
}

const DEFAULT_OPTIONS: JSONSchemaGenerationOptions = {
  unionStrategy: 'anyOf',
  discriminatedUnionStrategy: 'oneOf',
  discriminator: true,
}

/**
 * Converts a Zui schema to a ZUI flavored JSON schema.
 * @param schema zui schema
 * @returns ZUI flavored JSON schema
 */
export function toJSONSchema(schema: z.ZodType, options: Partial<JSONSchemaGenerationOptions> = {}): json.Schema {
  return _toJSONSchema(schema, options, new PropertyPath())
}

function _toJSONSchema(
  schema: z.ZodType,
  options: Partial<JSONSchemaGenerationOptions> = {},
  path: PropertyPath
): json.Schema {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const s = schema as z.ZodNativeType

  switch (s.typeName) {
    case 'ZodString':
      return zodStringToJsonString(s, path) satisfies json.StringSchema

    case 'ZodNumber':
      return zodNumberToJsonNumber(s) satisfies json.NumberSchema

    case 'ZodNaN':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodNaN', path.toString())

    case 'ZodBigInt':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodBigInt', path.toString(), {
        suggestedAlternative: 'serialize bigint to string',
      })

    case 'ZodBoolean':
      return {
        type: 'boolean',
        description: s.description,
        'x-zui': s._def['x-zui'],
      } satisfies json.BooleanSchema

    case 'ZodDate':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodDate', path.toString(), {
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
      throw new err.UnsupportedZuiToJSONSchemaError('ZodVoid', path.toString())

    case 'ZodArray':
      return zodArrayToJsonArray(s, (i) =>
        _toJSONSchema(i, opts, path.withIndexType('number'))
      ) satisfies json.ArraySchema

    case 'ZodObject':
      const shape = Object.entries(s.shape)
      const requiredProperties = shape.filter(([_, value]) => !value.isOptional())
      const required = requiredProperties.length ? requiredProperties.map(([key]) => key) : undefined
      const properties = shape
        .map(([key, value]) => [key, value.mandatory()] satisfies [string, z.ZodType])
        .map(
          ([key, value]) =>
            [key, _toJSONSchema(value, opts, path.withIndexType('key', key))] satisfies [string, json.Schema]
        )

      return {
        type: 'object',
        description: s.description,
        properties: Object.fromEntries(properties),
        required,
        additionalProperties: additionalPropertiesSchema(s._def, opts, path),
        'x-zui': s._def['x-zui'],
      } satisfies json.ObjectSchema

    case 'ZodUnion':
      if (opts.unionStrategy === 'oneOf') {
        return {
          description: s.description,
          oneOf: s.options.map((option, index) => _toJSONSchema(option, opts, path.withIndexType('number', index))),
          'x-zui': s._def['x-zui'],
        } satisfies json.UnionSchema
      }
      return {
        description: s.description,
        anyOf: s.options.map((option, index) => _toJSONSchema(option, opts, path.withIndexType('number', index))),
        'x-zui': s._def['x-zui'],
      } satisfies json.UnionSchema

    case 'ZodDiscriminatedUnion':
      if (opts.discriminatedUnionStrategy === 'oneOf') {
        const discriminator = opts.discriminator ? { propertyName: s.discriminator } : undefined
        return {
          description: s.description,
          oneOf: s.options.map((option, index) => _toJSONSchema(option, opts, path.withIndexType('number', index))),
          discriminator,
          'x-zui': {
            ...s._def['x-zui'],
            def: { typeName: 'ZodDiscriminatedUnion', discriminator: s.discriminator },
          },
        } satisfies json.DiscriminatedUnionSchema
      }
      return {
        description: s.description,
        anyOf: s.options.map((option, index) => _toJSONSchema(option, opts, path.withIndexType('number', index))),
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodDiscriminatedUnion', discriminator: s.discriminator },
        },
      } satisfies json.DiscriminatedUnionSchema

    case 'ZodIntersection':
      const left = _toJSONSchema(s._def.left, opts, path.withIndexType('number', 0))
      const right = _toJSONSchema(s._def.right, opts, path.withIndexType('number', 1))

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
      return zodTupleToJsonTuple(s, (i, p) => _toJSONSchema(i, opts, p), path) satisfies json.TupleSchema

    case 'ZodRecord': {
      const keyType = s._def.keyType
      const recordPath = z.is.zuiString(keyType)
        ? path.withIndexType('string')
        : z.is.zuiNumber(keyType)
          ? path.withIndexType('number')
          : path.withIndexType('any')
      return {
        type: 'object',
        description: s.description,
        additionalProperties: _toJSONSchema(s._def.valueType, opts, recordPath),
        'x-zui': s._def['x-zui'],
      } satisfies json.RecordSchema
    }

    case 'ZodMap':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodMap', path.toString())

    case 'ZodSet':
      return zodSetToJsonSet(s, (i) => _toJSONSchema(i, opts, path.withIndexType('number'))) satisfies json.SetSchema

    case 'ZodFunction':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodFunction', path.toString())

    case 'ZodLazy':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodLazy', path.toString())

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
        throw new err.ZuiToJSONSchemaError(`Unsupported literal type: "${unsupportedLiteral}"`, path.toString())
      }

    case 'ZodEnum':
      return {
        type: 'string',
        description: s.description,
        enum: s._def.values,
        'x-zui': s._def['x-zui'],
      } satisfies json.EnumSchema

    case 'ZodEffects':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodEffects', path.toString())

    case 'ZodNativeEnum':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodNativeEnum', path.toString())

    case 'ZodOptional':
      return {
        description: s.description,
        anyOf: [_toJSONSchema(s._def.innerType, opts, path), undefinedSchema()],
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodOptional' },
        },
      } satisfies json.OptionalSchema

    case 'ZodNullable':
      return {
        anyOf: [_toJSONSchema(s._def.innerType, opts, path), nullSchema()],
        'x-zui': {
          ...s._def['x-zui'],
          def: { typeName: 'ZodNullable' },
        },
      } satisfies json.NullableSchema

    case 'ZodDefault':
      // ZodDefault is not treated as a metadata root so we don't need to preserve x-zui
      return {
        ..._toJSONSchema(s._def.innerType, opts, path),
        default: s._def.defaultValue(),
      }

    case 'ZodCatch':
      // TODO: could be supported using if-else json schema
      throw new err.UnsupportedZuiToJSONSchemaError('ZodCatch', path.toString())

    case 'ZodPromise':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodPromise', path.toString())

    case 'ZodBranded':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodBranded', path.toString())

    case 'ZodPipeline':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodPipeline', path.toString())

    case 'ZodSymbol':
      throw new err.UnsupportedZuiToJSONSchemaError('ZodSymbol', path.toString())

    case 'ZodReadonly':
      // ZodReadonly is not treated as a metadata root so we don't need to preserve x-zui
      return {
        ..._toJSONSchema(s._def.innerType, opts, path),
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
  opts: Partial<JSONSchemaGenerationOptions>,
  path: PropertyPath
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

  return _toJSONSchema(def.unknownKeys, opts, path.withIndexType('string'))
}
