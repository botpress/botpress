import { mapValues, isEqual } from 'lodash-es'

import { zuiKey } from '../../ui/constants'
import z from '../../z'
import { util } from '../../z/types/utils'
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
  const s = schema as z.ZodNativeSchema

  switch (s.typeName) {
    case 'ZodString':
      return `z.string()${generateStringChecks(s._def)}${_addMetadata(s._def)}`.trim()

    case 'ZodNumber':
      return `z.number()${generateNumberChecks(s._def)}${_addMetadata(s._def)}`.trim()

    case 'ZodNaN':
      return `z.nan()${_addMetadata(s._def)}`.trim()

    case 'ZodBigInt':
      return `z.bigint()${generateBigIntChecks(s._def)}${_addMetadata(s._def)}`.trim()

    case 'ZodBoolean':
      return `z.boolean()${_addMetadata(s._def)}`.trim()

    case 'ZodDate':
      return `z.date()${generateDateChecks(s._def)}${_addMetadata(s._def)}`.trim()

    case 'ZodUndefined':
      return `z.undefined()${_addMetadata(s._def)}`.trim()

    case 'ZodNull':
      return `z.null()${_addMetadata(s._def)}`.trim()

    case 'ZodAny':
      return `z.any()${_addMetadata(s._def)}`.trim()

    case 'ZodUnknown':
      return `z.unknown()${_addMetadata(s._def)}`.trim()

    case 'ZodNever':
      return `z.never()${_addMetadata(s._def)}`.trim()

    case 'ZodVoid':
      return `z.void()${_addMetadata(s._def)}`.trim()

    case 'ZodArray':
      return `z.array(${sUnwrapZod(s._def.type)})${generateArrayChecks(s._def)}${_addMetadata(s._def, s._def.type)}`

    case 'ZodObject':
      const props = mapValues(s.shape, sUnwrapZod)
      const catchall = s.additionalProperties()
      const catchallString = catchall ? `.catchall(${sUnwrapZod(catchall)})` : ''
      return [
        //
        'z.object({',
        ...Object.entries(props).map(([key, value]) => `  ${key}: ${value},`),
        `})${catchallString}${_addMetadata(s._def)}`,
      ]
        .join('\n')
        .trim()

    case 'ZodUnion':
      const options = s._def.options.map(sUnwrapZod)
      return `z.union([${options.join(', ')}])${_addMetadata(s._def)}`.trim()

    case 'ZodDiscriminatedUnion':
      const opts = s._def.options.map(sUnwrapZod)
      const discriminator = primitiveToTypescriptValue(s._def.discriminator)
      return `z.discriminatedUnion(${discriminator}, [${opts.join(', ')}])${_addMetadata(s._def)}`.trim()

    case 'ZodIntersection':
      const left: string = sUnwrapZod(s._def.left)
      const right: string = sUnwrapZod(s._def.right)
      return `z.intersection(${left}, ${right})${_addMetadata(s._def)}`.trim()

    case 'ZodTuple':
      const items = s._def.items.map(sUnwrapZod)
      return `z.tuple([${items.join(', ')}])${_addMetadata(s._def)}`.trim()

    case 'ZodRecord':
      const keyType = sUnwrapZod(s._def.keyType)
      const valueType = sUnwrapZod(s._def.valueType)
      return `z.record(${keyType}, ${valueType})${_addMetadata(s._def)}`.trim()

    case 'ZodMap':
      const mapKeyType = sUnwrapZod(s._def.keyType)
      const mapValueType = sUnwrapZod(s._def.valueType)
      return `z.map(${mapKeyType}, ${mapValueType})${_addMetadata(s._def)}`.trim()

    case 'ZodSet':
      return `z.set(${sUnwrapZod(s._def.valueType)})${generateSetChecks(s._def)}${_addMetadata(s._def)}`.trim()

    case 'ZodFunction':
      const args = s._def.args.items.map(sUnwrapZod)
      const argsString = args.length ? `.args(${args.join(', ')})` : ''
      const returns = sUnwrapZod(s._def.returns)
      return `z.function()${argsString}.returns(${returns})${_addMetadata(s._def)}`.trim()

    case 'ZodLazy':
      return `z.lazy(() => ${sUnwrapZod(s._def.getter())})${_addMetadata(s._def)}`.trim()

    case 'ZodLiteral':
      const value = primitiveToTypescriptValue(s._def.value)
      return `z.literal(${value})${_addMetadata(s._def)}`.trim()

    case 'ZodEnum':
      const values = s._def.values.map(primitiveToTypescriptValue)
      return `z.enum([${values.join(', ')}])${_addMetadata(s._def)}`.trim()

    case 'ZodEffects':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodEffects')

    case 'ZodNativeEnum':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodNativeEnum')

    case 'ZodOptional':
      return `z.optional(${sUnwrapZod(s._def.innerType)})${_addMetadata(s._def, s._def.innerType)}`.trim()

    case 'ZodNullable':
      return `z.nullable(${sUnwrapZod(s._def.innerType)})${_addMetadata(s._def, s._def.innerType)}`.trim()

    case 'ZodDefault':
      const defaultValue = unknownToTypescriptValue(s._def.defaultValue())
      // TODO: use z.default() notation
      return `z.default(${sUnwrapZod(s._def.innerType)}, ${defaultValue})${_addMetadata(s._def, s._def.innerType)}`.trim()

    case 'ZodCatch':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodCatch')

    case 'ZodPromise':
      return `z.promise(${sUnwrapZod(s._def.type)})${_addMetadata(s._def, s._def.type)}`.trim()

    case 'ZodBranded':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodBranded')

    case 'ZodPipeline':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodPipeline')

    case 'ZodSymbol':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodSymbol')

    case 'ZodReadonly':
      return `z.readonly(${sUnwrapZod(s._def.innerType)})${_addMetadata(s._def, s._def.innerType)}`.trim()

    case 'ZodRef':
      const uri = primitiveToTypescriptValue(s._def.uri)
      return `z.ref(${uri})${_addMetadata(s._def)}`.trim()

    default:
      util.assertNever(s)
  }
}

const _addMetadata = (def: z.ZodTypeDef, inner?: z.ZodType) => {
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
