import { mapValues } from 'lodash-es'

import z, { util } from '../../z'
import { primitiveToTypescriptValue, getMultilineComment, unknownToTypescriptValue } from '../common/utils'
import * as errors from '../common/errors'

/**
 *
 * @param schema zui schema
 * @param options generation options
 * @returns a typescript program that would construct the given schema if executed
 */
export function toTypescriptSchema(schema: z.Schema): string {
  let wrappedSchema: z.Schema = schema
  let dts = sUnwrapZod(wrappedSchema)
  return dts
}

function sUnwrapZod(schema: z.Schema): string {
  const schemaTyped = schema as z.ZodFirstPartySchemaTypes
  const def = schemaTyped._def

  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return `${getMultilineComment(def.description)}z.string()`.trim()

    case z.ZodFirstPartyTypeKind.ZodNumber:
      return `${getMultilineComment(def.description)}z.number()`.trim()

    case z.ZodFirstPartyTypeKind.ZodNaN:
      return `${getMultilineComment(def.description)}z.nan()`.trim()

    case z.ZodFirstPartyTypeKind.ZodBigInt:
      return `${getMultilineComment(def.description)}z.bigint()`.trim()

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return `${getMultilineComment(schema._def.description)}z.boolean()`.trim()

    case z.ZodFirstPartyTypeKind.ZodDate:
      return `${getMultilineComment(def.description)}z.date()`.trim()

    case z.ZodFirstPartyTypeKind.ZodUndefined:
      return `${getMultilineComment(def.description)}z.undefined()`.trim()

    case z.ZodFirstPartyTypeKind.ZodNull:
      return `${getMultilineComment(def.description)}z.null()`.trim()

    case z.ZodFirstPartyTypeKind.ZodAny:
      return `${getMultilineComment(def.description)}z.any()`.trim()

    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return `${getMultilineComment(def.description)}z.unknown()`.trim()

    case z.ZodFirstPartyTypeKind.ZodNever:
      return `${getMultilineComment(def.description)}z.never()`.trim()

    case z.ZodFirstPartyTypeKind.ZodVoid:
      return `${getMultilineComment(def.description)}z.void()`.trim()

    case z.ZodFirstPartyTypeKind.ZodArray:
      return `z.array(${sUnwrapZod(def.type)})`

    case z.ZodFirstPartyTypeKind.ZodObject:
      const props = mapValues(def.shape(), (value) => {
        if (value instanceof z.Schema) {
          return sUnwrapZod(value)
        }
        return `z.any()`
      })
      return [
        //
        `${getMultilineComment(def.description)}z.object({`,
        ...Object.entries(props).map(([key, value]) => `  ${key}: ${value},`),
        `})`,
      ]
        .join('\n')
        .trim()

    case z.ZodFirstPartyTypeKind.ZodUnion:
      const options = def.options.map(sUnwrapZod)
      return `${getMultilineComment(def.description)}z.union([${options.join(', ')}])`.trim()

    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      const opts = (def.options as z.ZodSchema[]).map(sUnwrapZod)
      const discriminator = primitiveToTypescriptValue(def.discriminator)
      return `${getMultilineComment(def.description)}z.discriminatedUnion(${discriminator}, [${opts.join(', ')}])`.trim()

    case z.ZodFirstPartyTypeKind.ZodIntersection:
      const left: string = sUnwrapZod(def.left)
      const right: string = sUnwrapZod(def.right)
      return `${getMultilineComment(def.description)}z.intersection(${left}, ${right})`.trim()

    case z.ZodFirstPartyTypeKind.ZodTuple:
      const items = def.items.map(sUnwrapZod)
      return `${getMultilineComment(def.description)}z.tuple([${items.join(', ')}])`.trim()

    case z.ZodFirstPartyTypeKind.ZodRecord:
      const keyType = sUnwrapZod(def.keyType)
      const valueType = sUnwrapZod(def.valueType)
      return `${getMultilineComment(def.description)}z.record(${keyType}, ${valueType})`.trim()

    case z.ZodFirstPartyTypeKind.ZodMap:
      const mapKeyType = sUnwrapZod(def.keyType)
      const mapValueType = sUnwrapZod(def.valueType)
      return `${getMultilineComment(def.description)}z.map(${mapKeyType}, ${mapValueType})`.trim()

    case z.ZodFirstPartyTypeKind.ZodSet:
      return `${getMultilineComment(def.description)}z.set(${sUnwrapZod(def.valueType)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodFunction:
      const args = def.args.items.map(sUnwrapZod)
      const argsString = args.length ? `.args(${args.join(', ')})` : ''
      const returns = sUnwrapZod(def.returns)
      return `${getMultilineComment(def.description)}z.function()${argsString}.returns(${returns})`.trim()

    case z.ZodFirstPartyTypeKind.ZodLazy:
      return `${getMultilineComment(def.description)}z.lazy(() => ${sUnwrapZod(def.getter())})`.trim()

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      const value = primitiveToTypescriptValue(def.value)
      return `${getMultilineComment(def.description)}z.literal(${value})`.trim()

    case z.ZodFirstPartyTypeKind.ZodEnum:
      const values = def.values.map(primitiveToTypescriptValue)
      return `${getMultilineComment(def.description)}z.enum([${values.join(', ')}])`.trim()

    case z.ZodFirstPartyTypeKind.ZodEffects:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodEffects)

    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodNativeEnum)

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return `${getMultilineComment(def.description)}z.optional(${sUnwrapZod(def.innerType)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return `${getMultilineComment(def.description)}z.nullable(${sUnwrapZod(def.innerType)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodDefault:
      const defaultValue = unknownToTypescriptValue(def.defaultValue())
      // TODO: use z.default() notation
      return `${getMultilineComment(def.description)}${sUnwrapZod(def.innerType)}.default(${defaultValue})`.trim()

    case z.ZodFirstPartyTypeKind.ZodCatch:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodCatch)

    case z.ZodFirstPartyTypeKind.ZodPromise:
      return `${getMultilineComment(def.description)}z.promise(${sUnwrapZod(def.type)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodBranded:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodBranded)

    case z.ZodFirstPartyTypeKind.ZodPipeline:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodPipeline)

    case z.ZodFirstPartyTypeKind.ZodSymbol:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodSymbol)

    case z.ZodFirstPartyTypeKind.ZodReadonly:
      return `${getMultilineComment(def.description)}z.readonly(${sUnwrapZod(def.innerType)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodRef:
      const uri = primitiveToTypescriptValue(def.uri)
      return `${getMultilineComment(def.description)}z.ref(${uri})`.trim()

    default:
      util.assertNever(def)
  }
}
