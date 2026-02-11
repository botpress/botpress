import { mapValues, isEqual } from 'lodash-es'

import { zuiKey } from '../../ui/constants'
import z, { util } from '../../z'
import * as errors from '../common/errors'
import {
  primitiveToTypescriptValue,
  unknownToTypescriptValue,
  recordOfUnknownToTypescriptRecord,
} from '../common/utils'
import { generateArrayChecks } from './array-checks'
import { generateBigIntChecks } from './bigint-checks'
import { generateDateChecks } from './date-checks'
import { generateNumberChecks } from './number-checks'
import { generateSetChecks } from './set-checks'
import { generateStringChecks } from './string-checks'

/**
 *
 * @param schema zui schema
 * @param options generation options
 * @returns a typescript program that would construct the given schema if executed
 */
export function toTypescriptSchema(schema: z.Schema): string {
  const wrappedSchema: z.Schema = schema
  const dts = sUnwrapZod(wrappedSchema)
  return dts
}

function sUnwrapZod(schema: z.Schema): string {
  const schemaTyped = schema as z.ZodFirstPartySchemaTypes
  const def = schemaTyped._def

  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return `z.string()${generateStringChecks(def)}${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNumber:
      return `z.number()${generateNumberChecks(def)}${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNaN:
      return `z.nan()${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodBigInt:
      return `z.bigint()${generateBigIntChecks(def)}${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return `z.boolean()${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodDate:
      return `z.date()${generateDateChecks(def)}${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodUndefined:
      return `z.undefined()${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNull:
      return `z.null()${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodAny:
      return `z.any()${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return `z.unknown()${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNever:
      return `z.never()${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodVoid:
      return `z.void()${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodArray:
      return `z.array(${sUnwrapZod(def.type)})${generateArrayChecks(def)}${_addMetadata(def, def.type)}`

    case z.ZodFirstPartyTypeKind.ZodObject:
      const props = mapValues(def.shape(), sUnwrapZod)
      const catchall = (schema as z.ZodObject).additionalProperties()
      const catchallString = catchall ? `.catchall(${sUnwrapZod(catchall)})` : ''
      return [
        //
        'z.object({',
        ...Object.entries(props).map(([key, value]) => `  ${key}: ${value},`),
        `})${catchallString}${_addMetadata(def)}`,
      ]
        .join('\n')
        .trim()

    case z.ZodFirstPartyTypeKind.ZodUnion:
      const options = def.options.map(sUnwrapZod)
      return `z.union([${options.join(', ')}])${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      const opts = (def.options as z.ZodSchema[]).map(sUnwrapZod)
      const discriminator = primitiveToTypescriptValue(def.discriminator)
      return `z.discriminatedUnion(${discriminator}, [${opts.join(', ')}])${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodIntersection:
      const left: string = sUnwrapZod(def.left)
      const right: string = sUnwrapZod(def.right)
      return `z.intersection(${left}, ${right})${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodTuple:
      const items = def.items.map(sUnwrapZod)
      return `z.tuple([${items.join(', ')}])${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodRecord:
      const keyType = sUnwrapZod(def.keyType)
      const valueType = sUnwrapZod(def.valueType)
      return `z.record(${keyType}, ${valueType})${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodMap:
      const mapKeyType = sUnwrapZod(def.keyType)
      const mapValueType = sUnwrapZod(def.valueType)
      return `z.map(${mapKeyType}, ${mapValueType})${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodSet:
      return `z.set(${sUnwrapZod(def.valueType)})${generateSetChecks(def)}${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodFunction:
      const args = def.args.items.map(sUnwrapZod)
      const argsString = args.length ? `.args(${args.join(', ')})` : ''
      const returns = sUnwrapZod(def.returns)
      return `z.function()${argsString}.returns(${returns})${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodLazy:
      return `z.lazy(() => ${sUnwrapZod(def.getter())})${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      const value = primitiveToTypescriptValue(def.value)
      return `z.literal(${value})${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodEnum:
      const values = def.values.map(primitiveToTypescriptValue)
      return `z.enum([${values.join(', ')}])${_addMetadata(def)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodEffects:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodEffects)

    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodNativeEnum)

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return `z.optional(${sUnwrapZod(def.innerType)})${_addMetadata(def, def.innerType)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return `z.nullable(${sUnwrapZod(def.innerType)})${_addMetadata(def, def.innerType)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodDefault:
      const defaultValue = unknownToTypescriptValue(def.defaultValue())
      // TODO: use z.default() notation
      return `z.default(${sUnwrapZod(def.innerType)}, ${defaultValue})${_addMetadata(def, def.innerType)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodCatch:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodCatch)

    case z.ZodFirstPartyTypeKind.ZodPromise:
      return `z.promise(${sUnwrapZod(def.type)})${_addMetadata(def, def.type)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodBranded:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodBranded)

    case z.ZodFirstPartyTypeKind.ZodPipeline:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodPipeline)

    case z.ZodFirstPartyTypeKind.ZodSymbol:
      throw new errors.UnsupportedZuiToTypescriptSchemaError(z.ZodFirstPartyTypeKind.ZodSymbol)

    case z.ZodFirstPartyTypeKind.ZodReadonly:
      return `z.readonly(${sUnwrapZod(def.innerType)})${_addMetadata(def, def.innerType)}`.trim()

    case z.ZodFirstPartyTypeKind.ZodRef:
      const uri = primitiveToTypescriptValue(def.uri)
      return `z.ref(${uri})${_addMetadata(def)}`.trim()

    default:
      util.assertNever(def)
  }
}

const _addMetadata = (def: z.ZodTypeDef, inner?: z.ZodTypeAny) => {
  const innerDef = inner?._def
  return `${_addZuiExtensions(def, innerDef)}${_maybeDescribe(def, innerDef)}`
}

const _maybeDescribe = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) => {
  if (!def.description) {
    return ''
  }
  if (innerDef && innerDef.description === def.description) {
    return ''
  }
  return `.describe(${primitiveToTypescriptValue(def.description)})`
}

const _addZuiExtensions = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) =>
  `${_maybeTitle(def, innerDef)}${_maybeDisplayAs(def, innerDef)}${_maybeDisabled(def, innerDef)}${_maybeHidden(def, innerDef)}${_maybePlaceholder(def, innerDef)}${_maybeSecret(def, innerDef)}${_maybeSetMetadata(def, innerDef)}`

const _maybeTitle = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) => {
  const title = def[zuiKey]?.title
  if (!title) {
    return ''
  }
  if (innerDef && innerDef[zuiKey]?.title === title) {
    return ''
  }
  return `.title(${primitiveToTypescriptValue(title)})`
}

const _maybeDisplayAs = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) => {
  const displayAs = def[zuiKey]?.displayAs
  if (!displayAs) {
    return ''
  }
  if (innerDef && isEqual(innerDef[zuiKey]?.displayAs, displayAs)) {
    return ''
  }
  return `.displayAs(${recordOfUnknownToTypescriptRecord({ id: displayAs[0], params: displayAs[1] })})`
}

const _maybeDisabled = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) => {
  const disabled = def[zuiKey]?.disabled
  if (!disabled) {
    return ''
  }
  if (innerDef && innerDef[zuiKey]?.disabled === disabled) {
    return ''
  }
  return `.disabled(${disabled})`
}

const _maybeHidden = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) => {
  const hidden = def[zuiKey]?.hidden
  if (!hidden) {
    return ''
  }
  if (innerDef && innerDef[zuiKey]?.hidden === hidden) {
    return ''
  }
  return `.hidden(${hidden})`
}

const _maybePlaceholder = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) => {
  const placeholder = def[zuiKey]?.placeholder
  if (!placeholder) {
    return ''
  }
  if (innerDef && innerDef[zuiKey]?.placeholder === placeholder) {
    return ''
  }
  return `.placeholder(${primitiveToTypescriptValue(placeholder)})`
}

const _maybeSecret = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) => {
  const secret = def[zuiKey]?.secret
  if (!secret) {
    return ''
  }
  if (innerDef && innerDef[zuiKey]?.secret === secret) {
    return ''
  }
  return '.secret()'
}

const _maybeSetMetadata = (def: z.ZodTypeDef, innerDef?: z.ZodTypeDef) => {
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
    ([key]) => !reservedKeys.includes(key as (typeof reservedKeys)[number])
  )

  if (metadata.length === 0) {
    return ''
  }

  if (innerDef) {
    const innerMetadata = Object.entries(innerDef[zuiKey] ?? {}).filter(
      ([key]) => !reservedKeys.includes(key as (typeof reservedKeys)[number])
    )
    if (isEqual(Object.fromEntries(metadata), Object.fromEntries(innerMetadata))) {
      return ''
    }
  }

  return `.metadata(${recordOfUnknownToTypescriptRecord(Object.fromEntries(metadata))})`
}
