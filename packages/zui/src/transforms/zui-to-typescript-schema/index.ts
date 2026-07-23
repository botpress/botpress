import { isEqual } from 'lodash-es'

import * as utils from '../../utils'
import { PropertyPath } from '../../utils/property-path-utils'
import * as z from '../../z'
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

const { zuiKey } = z

/**
 *
 * @param schema zui schema
 * @param options generation options
 * @returns a typescript program that would construct the given schema if executed
 */
export function toTypescriptSchema(schema: z.ZodType): string {
  return _toTypescriptSchema(schema, new PropertyPath())
}

type RecursionCtx = {
  onPath: Set<symbol>
  nameOf: Map<symbol, string>
  defs: Map<string, string>
  usedNames: Set<string>
  counter: { n: number }
}

const assignRecursionName = (schema: z.ZodType, ctx: RecursionCtx): string => {
  const meta = schema.getMetadata()
  const title = typeof meta.title === 'string' && meta.title.length > 0 ? meta.title : undefined
  const base = title ?? `Schema${ctx.counter.n++}`
  let name = base
  let i = 1
  while (ctx.usedNames.has(name)) name = `${base}${i++}`
  ctx.usedNames.add(name)
  return name
}

function _toTypescriptSchema(schema: z.ZodType, path: PropertyPath): string {
  const ctx: RecursionCtx = {
    onPath: new Set(),
    nameOf: new Map(),
    defs: new Map(),
    usedNames: new Set(),
    counter: { n: 0 },
  }
  const entry = sUnwrapZod(schema, path, ctx)
  if (ctx.defs.size === 0) return entry
  const declarations = [...ctx.defs].map(([name, body]) => `const ${name} = ${body};`).join('\n')
  let finalEntry = entry
  for (const [name, body] of ctx.defs) {
    if (body === entry.trim()) {
      finalEntry = name
      break
    }
  }
  return `${declarations}\n${finalEntry}`
}

function sUnwrapZod(schema: z.ZodType, path: PropertyPath, ctx: RecursionCtx): string {
  const s = schema as z.ZodNativeType
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
      return `z.array(${sUnwrapZod(s._def.type, path.withIndexType('number'), ctx)})${generateArrayChecks(s._def)}${_addMetadata(s._def, s._def.type)}`

    case 'ZodObject':
      const props: Record<string, string> = {}
      for (const [key, value] of Object.entries(s.shape)) {
        props[key] = sUnwrapZod(value, path.withIndexType('key', key), ctx)
      }
      const catchall = s.additionalProperties()
      const catchallString = catchall
        ? `.catchall(${sUnwrapZod(catchall, path.withIndexType('string'), ctx)})`
        : ''
      return [
        //
        'z.object({',
        ...Object.entries(props).map(([key, value]) => `  ${key}: ${value},`),
        `})${catchallString}${_addMetadata(s._def)}`,
      ]
        .join('\n')
        .trim()

    case 'ZodUnion':
      const options = s._def.options.map((option, index) =>
        sUnwrapZod(option, path.withIndexType('number', index), ctx)
      )
      return `z.union([${options.join(', ')}])${_addMetadata(s._def)}`.trim()

    case 'ZodDiscriminatedUnion':
      const opts = s._def.options.map((option, index) =>
        sUnwrapZod(option, path.withIndexType('number', index), ctx)
      )
      const discriminator = primitiveToTypescriptValue(s._def.discriminator)
      return `z.discriminatedUnion(${discriminator}, [${opts.join(', ')}])${_addMetadata(s._def)}`.trim()

    case 'ZodIntersection':
      const left: string = sUnwrapZod(s._def.left, path.withIndexType('number', 0), ctx)
      const right: string = sUnwrapZod(s._def.right, path.withIndexType('number', 1), ctx)
      return `z.intersection(${left}, ${right})${_addMetadata(s._def)}`.trim()

    case 'ZodTuple':
      const items = s._def.items.map((item, index) => sUnwrapZod(item, path.withIndexType('number', index), ctx))
      return `z.tuple([${items.join(', ')}])${_addMetadata(s._def)}`.trim()

    case 'ZodRecord':
      const keyType = sUnwrapZod(s._def.keyType, path.withWrapper('KeyOf'), ctx)
      const recordPath = z.is.zuiString(s._def.keyType)
        ? path.withIndexType('string')
        : z.is.zuiNumber(s._def.keyType)
          ? path.withIndexType('number')
          : path.withIndexType('any')
      const valueType = sUnwrapZod(s._def.valueType, recordPath, ctx)
      return `z.record(${keyType}, ${valueType})${_addMetadata(s._def)}`.trim()

    case 'ZodMap':
      const mapKeyType = sUnwrapZod(s._def.keyType, path.withWrapper('KeyOf'), ctx)
      const mapPath = z.is.zuiString(s._def.keyType)
        ? path.withIndexType('string')
        : z.is.zuiNumber(s._def.keyType)
          ? path.withIndexType('number')
          : path.withIndexType('any')
      const mapValueType = sUnwrapZod(s._def.valueType, mapPath, ctx)
      return `z.map(${mapKeyType}, ${mapValueType})${_addMetadata(s._def)}`.trim()

    case 'ZodSet':
      return `z.set(${sUnwrapZod(s._def.valueType, path.withIndexType('number'), ctx)})${generateSetChecks(s._def)}${_addMetadata(s._def)}`.trim()

    case 'ZodFunction':
      const args = s._def.args.items.map((arg, index) =>
        sUnwrapZod(arg, path.withWrapper('Parameters').withIndexType('number', index), ctx)
      )
      const argsString = args.length ? `.args(${args.join(', ')})` : ''
      const returns = sUnwrapZod(s._def.returns, path.withWrapper('ReturnType'), ctx)
      return `z.function()${argsString}.returns(${returns})${_addMetadata(s._def)}`.trim()

    case 'ZodLazy': {
      const uid = s._def.uid
      const hoisted = ctx.nameOf.get(uid)
      if (hoisted) return `z.lazy(() => ${hoisted})${_addMetadata(s._def)}`.trim()
      if (ctx.onPath.has(uid)) {
        const name = assignRecursionName(s, ctx)
        ctx.nameOf.set(uid, name)
        return `z.lazy(() => ${name})${_addMetadata(s._def)}`.trim()
      }
      ctx.onPath.add(uid)
      let body: string
      try {
        body = sUnwrapZod(s._def.getter(), path, ctx)
      } finally {
        ctx.onPath.delete(uid)
      }
      const name = ctx.nameOf.get(uid)
      if (name) {
        ctx.defs.set(name, body)
        return `z.lazy(() => ${name})${_addMetadata(s._def)}`.trim()
      }
      return `z.lazy(() => ${body})${_addMetadata(s._def)}`.trim()
    }

    case 'ZodLiteral':
      const value = primitiveToTypescriptValue(s._def.value)
      return `z.literal(${value})${_addMetadata(s._def)}`.trim()

    case 'ZodEnum':
      const values = s._def.values.map(primitiveToTypescriptValue)
      return `z.enum([${values.join(', ')}])${_addMetadata(s._def)}`.trim()

    case 'ZodEffects':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodEffects', path.toString())

    case 'ZodNativeEnum':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodNativeEnum', path.toString())

    case 'ZodOptional':
      return `z.optional(${sUnwrapZod(s._def.innerType, path, ctx)})${_addMetadata(s._def, s._def.innerType)}`.trim()

    case 'ZodNullable':
      return `z.nullable(${sUnwrapZod(s._def.innerType, path, ctx)})${_addMetadata(s._def, s._def.innerType)}`.trim()

    case 'ZodDefault':
      const defaultValue = unknownToTypescriptValue(s._def.defaultValue())
      return `z.default(${sUnwrapZod(s._def.innerType, path, ctx)}, ${defaultValue})${_addMetadata(s._def, s._def.innerType)}`.trim()

    case 'ZodCatch':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodCatch', path.toString())

    case 'ZodPromise':
      return `z.promise(${sUnwrapZod(s._def.type, path, ctx)})${_addMetadata(s._def, s._def.type)}`.trim()

    case 'ZodBranded':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodBranded', path.toString())

    case 'ZodPipeline':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodPipeline', path.toString())

    case 'ZodSymbol':
      throw new errors.UnsupportedZuiToTypescriptSchemaError('ZodSymbol', path.toString())

    case 'ZodReadonly':
      return `z.readonly(${sUnwrapZod(s._def.innerType, path, ctx)})${_addMetadata(s._def, s._def.innerType)}`.trim()

    case 'ZodRef':
      const uri = primitiveToTypescriptValue(s._def.uri)
      return `z.ref(${uri})${_addMetadata(s._def)}`.trim()

    default:
      utils.assert.assertNever(s)
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
