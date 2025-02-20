import { mapValues } from 'lodash-es'

import z, { util } from '../../z'
import {
  primitiveToTypescriptValue,
  unknownToTypescriptValue,
  recordOfUnknownToTypescriptRecord,
} from '../common/utils'
import * as errors from '../common/errors'
import { zuiKey } from '../../ui/constants'
import { generateStringChecks } from './string-checks'
import { generateNumberChecks } from './number-checks'
import { generateBigIntChecks } from './bigint-checks'
import { generateDateChecks } from './date-checks'
import { generateArrayChecks } from './array-checks'
import { generateSetChecks } from './set-checks'

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
      return `z.string()${generateStringChecks(def)}${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNumber:
      return `z.number()${generateNumberChecks(def)}${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNaN:
      return `z.nan()${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodBigInt:
      return `z.bigint()${generateBigIntChecks(def)}${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return `z.boolean()${_addZuiExtensions(def)}${_maybeDescribe(schema._def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodDate:
      return `z.date()${generateDateChecks(def)}${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodUndefined:
      return `z.undefined()${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNull:
      return `z.null()${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodAny:
      return `z.any()${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return `z.unknown()${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNever:
      return `z.never()${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodVoid:
      return `z.void()${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodArray:
      return `z.array(${sUnwrapZod(def.type)})${generateArrayChecks(def)}${_addZuiExtensions(def)}${_maybeDescribe(def)}`

    case z.ZodFirstPartyTypeKind.ZodObject:
      const props = mapValues(def.shape(), (value) => {
        if (value instanceof z.Schema) {
          return sUnwrapZod(value)
        }
        return `z.any()`
      })
      return [
        //
        `z.object({`,
        ...Object.entries(props).map(([key, value]) => `  ${key}: ${value},`),
        `})${_addZuiExtensions(def)}${_maybeDescribe(def)}`,
      ]
        .join('\n')
        .trim()

    case z.ZodFirstPartyTypeKind.ZodUnion:
      const options = def.options.map(sUnwrapZod)
      return `z.union([${options.join(', ')}])${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      const opts = (def.options as z.ZodSchema[]).map(sUnwrapZod)
      const discriminator = primitiveToTypescriptValue(def.discriminator)
      return `z.discriminatedUnion(${discriminator}, [${opts.join(', ')}])${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodIntersection:
      const left: string = sUnwrapZod(def.left)
      const right: string = sUnwrapZod(def.right)
      return `z.intersection(${left}, ${right})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodTuple:
      const items = def.items.map(sUnwrapZod)
      return `z.tuple([${items.join(', ')}])${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodRecord:
      const keyType = sUnwrapZod(def.keyType)
      const valueType = sUnwrapZod(def.valueType)
      return `z.record(${keyType}, ${valueType})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodMap:
      const mapKeyType = sUnwrapZod(def.keyType)
      const mapValueType = sUnwrapZod(def.valueType)
      return `z.map(${mapKeyType}, ${mapValueType})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodSet:
      return `z.set(${sUnwrapZod(def.valueType)})${generateSetChecks(def)}${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodFunction:
      const args = def.args.items.map(sUnwrapZod)
      const argsString = args.length ? `.args(${args.join(', ')})` : ''
      const returns = sUnwrapZod(def.returns)
      return `z.function()${argsString}.returns(${returns})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodLazy:
      return `z.lazy(() => ${sUnwrapZod(def.getter())})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      const value = primitiveToTypescriptValue(def.value)
      return `z.literal(${value})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodEnum:
      const values = def.values.map(primitiveToTypescriptValue)
      return `z.enum([${values.join(', ')}])${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodEffects:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodEffects)

    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodNativeEnum)

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return `z.optional(${sUnwrapZod(def.innerType)})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return `z.nullable(${sUnwrapZod(def.innerType)})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodDefault:
      const defaultValue = unknownToTypescriptValue(def.defaultValue())
      // TODO: use z.default() notation
      return `z.default(${sUnwrapZod(def.innerType)}, ${defaultValue})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodCatch:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodCatch)

    case z.ZodFirstPartyTypeKind.ZodPromise:
      return `z.promise(${sUnwrapZod(def.type)})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodBranded:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodBranded)

    case z.ZodFirstPartyTypeKind.ZodPipeline:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodPipeline)

    case z.ZodFirstPartyTypeKind.ZodSymbol:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodSymbol)

    case z.ZodFirstPartyTypeKind.ZodReadonly:
      return `z.readonly(${sUnwrapZod(def.innerType)})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodRef:
      const uri = primitiveToTypescriptValue(def.uri)
      return `z.ref(${uri})${_addZuiExtensions(def)}${_maybeDescribe(def)}`.trim()

    default:
      util.assertNever(def)
  }
}

const _maybeDescribe = (def: z.ZodTypeDef) =>
  def.description ? `.describe(${primitiveToTypescriptValue(def.description)})` : ''

const _addZuiExtensions = (def: z.ZodTypeDef) =>
  `${_maybeTitle(def)}${_maybeDisplayAs(def)}${_maybeDisabled(def)}${_maybeHidden(def)}${_maybePlaceholder(def)}${_maybeSecret(def)}${_maybeSetMetadata(def)}`

const _maybeTitle = (def: z.ZodTypeDef) =>
  def[zuiKey]?.title ? `.title(${primitiveToTypescriptValue(def[zuiKey].title)})` : ''

const _maybeDisplayAs = (def: z.ZodTypeDef) =>
  def[zuiKey]?.displayAs
    ? `.displayAs(${recordOfUnknownToTypescriptRecord({ id: def[zuiKey].displayAs[0], params: def[zuiKey].displayAs[1] })})`
    : ''

const _maybeDisabled = (def: z.ZodTypeDef) => (def[zuiKey]?.disabled ? `.disabled(${def[zuiKey].disabled})` : '')

const _maybeHidden = (def: z.ZodTypeDef) => (def[zuiKey]?.hidden ? `.hidden(${def[zuiKey].hidden})` : '')

const _maybePlaceholder = (def: z.ZodTypeDef) =>
  def[zuiKey]?.placeholder ? `.placeholder(${primitiveToTypescriptValue(def[zuiKey].placeholder)})` : ''

const _maybeSecret = (def: z.ZodTypeDef) => (def[zuiKey]?.secret ? '.secret()' : '')

const _maybeSetMetadata = (def: z.ZodTypeDef) => {
  const reservedKeys = [
    'title',
    'tooltip',
    'displayAs',
    'disabled',
    'hidden',
    'placeholder',
    'secret',
    'coerce',
  ] as const
  const metadata = Object.entries(def[zuiKey] ?? {}).filter(
    ([key]) => !reservedKeys.includes(key as (typeof reservedKeys)[number]),
  )

  return metadata.length > 0 ? `.metadata(${recordOfUnknownToTypescriptRecord(Object.fromEntries(metadata))})` : ''
}
