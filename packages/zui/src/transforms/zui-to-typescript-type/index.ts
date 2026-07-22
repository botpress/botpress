import * as utils from '../../utils'
import { PropertyPath } from '../../utils/property-path-utils'
import * as z from '../../z'
import * as errors from '../common/errors'
import {
  primitiveToTypescriptValue,
  getMultilineComment,
  toPropertyKey,
  toTypeArgumentName,
  primitiveToTypscriptLiteralType,
} from '../common/utils'

const Primitives = [
  'string',
  'number',
  'boolean',
  'unknown',
  'void',
  'any',
  'null',
  'undefined',
  'never',
  'bigint',
  'symbol',
  'object',
]

const LARGE_DECLARATION_LINES = 5

const isPrimitive = (type: string) => Primitives.includes(type)
const isArrayOfPrimitives = (type: string) => Primitives.map((p) => `${p}[]`).includes(type)

const stripSpaces = (typings: string) => typings.replace(/ +/g, ' ').trim()

class KeyValue {
  constructor(
    public key: string,
    public value: z.ZodType
  ) {}
}

class FnParameters {
  constructor(public schema: z.ZodType) {}
}

class FnReturn {
  constructor(public schema: z.ZodType) {}
}

class Declaration {
  constructor(public props: DeclarationProps) {}
}

type DeclarationProps =
  | {
      type: 'variable'
      schema: z.ZodType
      identifier: string
    }
  | {
      type: 'type'
      schema: z.ZodType
      identifier: string
      args: string[] // type arguments / generics
    }
  | {
      type: 'none'
      schema: z.ZodType
    }

export type TypescriptDeclarationType = DeclarationProps['type']

/**
 * @description Options for Typescript type generation.
 */
export type TypescriptGenerationOptions = {
  formatter?: (typing: string) => string
  declaration?: boolean | TypescriptDeclarationType
  /**
   * Whether to include closing tags in the generated TypeScript declarations when they exceed 5 lines.
   * This improves readability for large type declarations by adding comments like "// end of TypeName".
   */
  includeClosingTags?: boolean
  treatDefaultAsOptional?: boolean
}

type SchemaTypes = z.ZodType | KeyValue | FnParameters | Declaration | null

/**
 * Shared, mutable state for turning recursive (self- or mutually-referential) schemas into named TypeScript
 * type aliases. A recursive type cannot be written inline, so a schema that is re-entered while being expanded
 * (a cycle) is hoisted into a named `type X = {…}` alias and referenced by name at every recurrence.
 *
 * Cycle keys are the schema instance for getter-based recursion (Object → z.array → same Object) and the
 * ZodLazy uid for z.lazy-based recursion (its getter returns a fresh instance per call, so identity can't be
 * used there). Non-recursive schemas never populate `defs`, so their output is unchanged.
 */
type RecursionCtx = {
  onPath: Set<z.ZodType | symbol> // cycle keys currently being expanded (the DFS stack)
  nameOf: Map<z.ZodType | symbol, string> // cycle key -> hoisted alias name, once promoted to a definition
  defs: Map<string, string> // alias name -> type body, in insertion order
  usedNames: Set<string>
  counter: { n: number }
}

type InternalOptions = {
  parent?: SchemaTypes
  declaration?: boolean | TypescriptDeclarationType
  includeClosingTags?: boolean
  treatDefaultAsOptional?: boolean
  recursion: RecursionCtx
  // Suppress this one schema's own leading description comment (its parent KeyValue/declaration already emits
  // it). Replaces the former `.describe('')` clone-to-strip, which minted a fresh identity at every level and
  // defeated getter-recursion cycle detection. Applies to the current node only — reset for children.
  dropTopDescription?: boolean
}

/** Assigns a stable alias name for a cyclic schema: its title when present, else a synthetic `Schema<N>`. */
const assignRecursionName = (schema: z.ZodType, ctx: RecursionCtx): string => {
  const meta = schema.getMetadata()
  const title = typeof meta.title === 'string' && meta.title.length > 0 ? meta.title : undefined
  const base = title ?? `Schema${ctx.counter.n++}`
  let name = base
  let i = 1
  while (ctx.usedNames.has(name)) {
    name = `${base}${i++}`
  }
  ctx.usedNames.add(name)
  return name
}

/**
 * Wraps a schema expansion with cycle detection and hoisting. `key` is the cycle key (object instance for
 * getter recursion, ZodLazy uid for z.lazy); `schema` is used only for naming; `expand` produces the inline
 * body. On a back-edge the schema is promoted to a named definition and its name is emitted instead of
 * recursing; non-cyclic schemas are expanded inline exactly as before.
 */
const withCycleGuard = (
  key: z.ZodType | symbol,
  schema: z.ZodType,
  ctx: RecursionCtx,
  expand: () => string
): string => {
  const hoisted = ctx.nameOf.get(key)
  if (hoisted) return hoisted
  if (ctx.onPath.has(key)) {
    const name = assignRecursionName(schema, ctx)
    ctx.nameOf.set(key, name)
    return name
  }
  ctx.onPath.add(key)
  let body: string
  try {
    body = expand()
  } finally {
    ctx.onPath.delete(key)
  }
  const name = ctx.nameOf.get(key)
  if (name) {
    ctx.defs.set(name, body)
    return name
  }
  return body
}

/**
 *
 * @param schema zui schema
 * @param options generation options
 * @returns a string of the TypeScript **type** representing the schema
 */
export function toTypescriptType(schema: z.ZodType, options: TypescriptGenerationOptions = {}): string {
  return _toTypescriptType(schema, new PropertyPath(), options)
}

function _toTypescriptType(schema: z.ZodType, path: PropertyPath, options: TypescriptGenerationOptions = {}): string {
  const wrappedSchema: Declaration = getDeclarationProps(schema, options)

  const recursion: RecursionCtx = {
    onPath: new Set(),
    nameOf: new Map(),
    defs: new Map(),
    usedNames: new Set(),
    counter: { n: 0 },
  }

  const entry = sUnwrapZod(wrappedSchema, path, { ...options, recursion })

  let dts = entry
  if (recursion.defs.size > 0) {
    const declarations = [...recursion.defs].map(([name, body]) => `type ${name} = ${body};`).join('\n')
    // When the entry is exactly a hoisted alias name (the root schema is itself recursive), the alias
    // declaration already fully describes it — otherwise the entry references the aliases and is appended.
    dts = recursion.defs.has(entry.trim()) ? declarations : `${declarations}\n${entry}`
  }

  if (options.formatter) {
    dts = options.formatter(dts)
  }

  return dts
}

const _optionalKey = (key: string): string => (key.endsWith('?') ? key : `${key}?`)

function sUnwrapZod(
  schema: z.ZodType | KeyValue | FnParameters | Declaration | null,
  path: PropertyPath,
  config: InternalOptions
): string {
  const newConfig: InternalOptions = {
    ...config,
    declaration: false,
    parent: schema,
    dropTopDescription: false,
  }

  // Transparent metadata wrappers (optional/nullable/default/catch/readonly/branded/effects/pipeline) share
  // their naked root's description with their inner type, so a request to drop the top description must reach
  // that inner type — otherwise it would re-emit the description the parent already printed.
  const innerConfig: InternalOptions = { ...newConfig, dropTopDescription: config.dropTopDescription }

  if (schema === null) {
    return ''
  }

  if (schema instanceof Declaration) {
    return unwrapDeclaration(schema, path, newConfig)
  }

  if (schema instanceof KeyValue) {
    let optionalValue: z.ZodOptional | undefined = undefined

    if (z.is.zuiOptional(schema.value)) {
      optionalValue = schema.value
    } else if (z.is.zuiDefault(schema.value) && config.treatDefaultAsOptional) {
      optionalValue = schema.value._def.innerType.optional()
    }

    if (optionalValue) {
      let innerType = optionalValue._def.innerType
      if (z.is.zuiType(innerType) && !innerType.description && optionalValue.description) {
        innerType = innerType?.describe(optionalValue.description)
      }

      return sUnwrapZod(new KeyValue(_optionalKey(schema.key), innerType), path, newConfig)
    }

    const description = getMultilineComment(schema.value._def.description || schema.value.description)
    const delimiter = description?.trim().length > 0 ? '\n' : ''
    // The description is emitted here at the key level; suppress the value's own copy via the flag rather
    // than cloning it with `.describe('')` (which would break getter-recursion cycle detection).
    const valueTypings = sUnwrapZod(schema.value, path, { ...newConfig, dropTopDescription: true })

    const isOptional = z.is.zuiAny(schema.value) // any is treated as optional for backwards compatibility
    const key = isOptional ? _optionalKey(schema.key) : schema.key
    return `${delimiter}${description}${delimiter}${key}: ${valueTypings}${delimiter}`
  }

  if (schema instanceof FnParameters) {
    if (z.is.zuiTuple(schema.schema)) {
      let args = ''
      for (let i = 0; i < schema.schema.items.length; i++) {
        const argName = (schema.schema.items[i]?.ui?.title as string) ?? `arg${i}`
        const item = schema.schema.items[i]!
        args += `${sUnwrapZod(new KeyValue(toPropertyKey(argName), item), path.withIndexType('number', i), newConfig)}${
          i < schema.schema.items.length - 1 ? ', ' : ''
        } `
      }

      return args
    }

    const isLiteral = z.is.zuiLiteral(schema.schema.naked())

    const typings = sUnwrapZod(schema.schema, path, newConfig).trim()
    const startsWithPairs =
      (typings.startsWith('{') && typings.endsWith('}')) ||
      (typings.startsWith('[') && typings.endsWith(']')) ||
      (typings.startsWith('(') && typings.endsWith(')')) ||
      (typings.startsWith('Array<') && typings.endsWith('>')) ||
      (typings.startsWith('Record<') && typings.endsWith('>')) ||
      isArrayOfPrimitives(typings)

    if (startsWithPairs || isLiteral) {
      return `args: ${typings}`
    } else {
      return typings
    }
  }

  if (schema instanceof FnReturn) {
    if (z.is.zuiOptional(schema.schema)) {
      return `${sUnwrapZod(schema.schema.unwrap(), path, newConfig)} | undefined`
    }

    return sUnwrapZod(schema.schema, path, newConfig)
  }

  const s = schema as z.ZodFirstPartySchemaTypes

  // This node's own leading description comment, unless the parent asked to suppress it (see dropTopDescription).
  const leadingComment = (description?: string): string =>
    config.dropTopDescription ? '' : getMultilineComment(description)

  switch (s.typeName) {
    case 'ZodString':
      return `${leadingComment(s.description)} string`.trim()

    case 'ZodNumber':
    case 'ZodNaN':
    case 'ZodBigInt':
      return `${leadingComment(s.description)} number`.trim()

    case 'ZodBoolean':
      return `${leadingComment(s.description)} boolean`.trim()

    case 'ZodDate':
      return `${leadingComment(s.description)} Date`.trim()

    case 'ZodUndefined':
      return `${leadingComment(s.description)} undefined`.trim()

    case 'ZodNull':
      return `${leadingComment(s.description)} null`.trim()

    case 'ZodAny':
      return `${leadingComment(s.description)} any`.trim()

    case 'ZodUnknown':
      return `${leadingComment(s.description)} unknown`.trim()

    case 'ZodNever':
      return `${leadingComment(s.description)} never`.trim()

    case 'ZodVoid':
      return `${leadingComment(s.description)} void`.trim()

    case 'ZodArray':
      const item = sUnwrapZod(s._def.type, path.withIndexType('number'), newConfig)

      if (isPrimitive(item)) {
        return `${item}[]`
      }

      return `Array<${item}>`

    case 'ZodObject':
      return withCycleGuard(s, s, config.recursion, () => {
        const props = Object.entries(s._def.shape()).map(([key, value]) => {
          if (z.is.zuiType(value)) {
            return sUnwrapZod(new KeyValue(toPropertyKey(key), value), path.withIndexType('key', key), newConfig)
          }
          return `${key}: unknown`
        })

        return `{ ${props.join('; ')} }`
      })

    case 'ZodUnion':
      const options = s._def.options.map((option, index) => {
        return sUnwrapZod(option, path.withIndexType('number', index), newConfig)
      })
      return `${leadingComment(s.description)}
${options.join(' | ')}`

    case 'ZodDiscriminatedUnion':
      const opts = s._def.options.map((option, index) => {
        return sUnwrapZod(option, path.withIndexType('number', index), newConfig)
      })
      return `${leadingComment(s.description)}
${opts.join(' | ')}`

    case 'ZodIntersection':
      return `${sUnwrapZod(s._def.left, path.withIndexType('number', 0), newConfig)} & ${sUnwrapZod(s._def.right, path.withIndexType('number', 1), newConfig)}`

    case 'ZodTuple':
      if (s._def.items.length === 0) {
        return '[]'
      }

      const items = s._def.items.map((i, index) => sUnwrapZod(i, path.withIndexType('number', index), newConfig))
      return `[${items.join(', ')}]`

    case 'ZodRecord': {
      const keyType = sUnwrapZod(s._def.keyType, path.withWrapper('KeyOf'), newConfig)
      const recordPath = z.is.zuiString(s._def.keyType)
        ? path.withIndexType('string')
        : z.is.zuiNumber(s._def.keyType)
          ? path.withIndexType('number')
          : path.withIndexType('any')
      const valueType = sUnwrapZod(s._def.valueType, recordPath, newConfig)
      return `${leadingComment(s.description)} { [key: ${keyType}]: ${valueType} }`
    }

    case 'ZodMap': {
      const recordPath = z.is.zuiString(s._def.keyType)
        ? path.withIndexType('string')
        : z.is.zuiNumber(s._def.keyType)
          ? path.withIndexType('number')
          : path.withIndexType('any')
      return `Map<${sUnwrapZod(s._def.keyType, path.withWrapper('KeyOf'), newConfig)}, ${sUnwrapZod(s._def.valueType, recordPath, newConfig)}>`
    }

    case 'ZodSet':
      return `Set<${sUnwrapZod(s._def.valueType, path.withIndexType('number'), newConfig)}>`

    case 'ZodFunction':
      const input = sUnwrapZod(new FnParameters(s._def.args), path.withWrapper('Parameters'), newConfig)
      const output = sUnwrapZod(new FnReturn(s._def.returns), path.withWrapper('ReturnType'), newConfig)
      const parentIsType = config?.parent instanceof Declaration && config?.parent.props.type === 'type'

      if (config?.declaration && !parentIsType) {
        return `${leadingComment(s.description)}
(${input}): ${output}`
      }

      return `${leadingComment(s.description)}
(${input}) => ${output}`

    case 'ZodLazy':
      return withCycleGuard(s._def.uid, s, config.recursion, () => sUnwrapZod(s._def.getter(), path, newConfig))

    case 'ZodLiteral':
      const value: string = primitiveToTypscriptLiteralType(s._def.value)
      return `${leadingComment(s.description)}
${value}`.trim()

    case 'ZodEnum':
      const values = s._def.values.map(primitiveToTypescriptValue)
      return values.join(' | ')

    case 'ZodEffects':
      return sUnwrapZod(s._def.schema, path, innerConfig)

    case 'ZodNativeEnum':
      throw new errors.UnsupportedZuiToTypescriptTypeError('ZodNativeEnum', path.toString())

    case 'ZodOptional':
      return `${sUnwrapZod(s._def.innerType, path, innerConfig)} | undefined`

    case 'ZodNullable':
      return `${sUnwrapZod(s._def.innerType, path, innerConfig)} | null`

    case 'ZodDefault':
      const defaultInnerType = config.treatDefaultAsOptional ? s._def.innerType.optional() : s._def.innerType
      return sUnwrapZod(defaultInnerType, path, innerConfig)

    case 'ZodCatch':
      return sUnwrapZod(s._def.innerType, path, innerConfig)

    case 'ZodPromise':
      return `Promise<${sUnwrapZod(s._def.type, path, newConfig)}>`

    case 'ZodBranded':
      return sUnwrapZod(s._def.type, path, innerConfig)

    case 'ZodPipeline':
      return sUnwrapZod(s._def.in, path, innerConfig)

    case 'ZodSymbol':
      return `${leadingComment(s.description)} symbol`.trim()

    case 'ZodReadonly':
      return `Readonly<${sUnwrapZod(s._def.innerType, path, innerConfig)}>`

    case 'ZodRef':
      return toTypeArgumentName(s._def.uri)

    default:
      utils.assert.assertNever(s)
  }
}

const unwrapDeclaration = (declaration: Declaration, path: PropertyPath, options: InternalOptions): string => {
  if (declaration.props.type === 'none') {
    return sUnwrapZod(declaration.props.schema, path, options)
  }

  const { schema, identifier } = declaration.props
  const description = getMultilineComment(schema.description)
  // The description is emitted here at the declaration level; suppress the schema's own copy via the flag
  // rather than cloning it with `.describe('')` (which would break getter-recursion cycle detection).
  const typings = sUnwrapZod(schema, path, { ...options, declaration: true, dropTopDescription: true })

  const isLargeDeclaration = typings.split('\n').length >= LARGE_DECLARATION_LINES
  const closingTag = isLargeDeclaration && options.includeClosingTags ? `// end of ${identifier}` : ''

  if (declaration.props.type !== 'type' && schema.typeName === 'ZodFunction') {
    return stripSpaces(`${description}
declare function ${identifier}${typings};${closingTag}`)
  }

  if (declaration.props.type === 'variable') {
    return stripSpaces(`${description}declare const ${identifier}: ${typings};${closingTag}`)
  }

  // If the root schema is itself recursive it was hoisted under this exact identifier; fold its body into
  // this declaration rather than emitting a broken `type Id = Id` plus a duplicate alias.
  let body = typings
  let typeClosingTag = closingTag
  if (typings.trim() === identifier && options.recursion.defs.has(identifier)) {
    body = options.recursion.defs.get(identifier)!
    options.recursion.defs.delete(identifier)
    const isLargeBody = body.split('\n').length >= LARGE_DECLARATION_LINES
    typeClosingTag = isLargeBody && options.includeClosingTags ? `// end of ${identifier}` : ''
  }

  const generics =
    declaration.props.args.length > 0 ? `<${declaration.props.args.map(toTypeArgumentName).join(', ')}>` : ''
  return stripSpaces(`${description}type ${declaration.props.identifier}${generics} = ${body};${typeClosingTag}`)
}

const getDeclarationType = (options: TypescriptGenerationOptions): TypescriptDeclarationType => {
  if (!options.declaration) {
    return 'none'
  }
  if (options.declaration === true) {
    return 'variable'
  }
  return options.declaration
}

const getDeclarationProps = (schema: z.ZodType, options: TypescriptGenerationOptions): Declaration => {
  const declarationType = getDeclarationType(options)
  const args = schema.getReferences()

  if (declarationType === 'none') {
    if (args.length > 0) {
      throw new errors.UnrepresentableGenericError()
    }

    return new Declaration({ type: 'none', schema })
  }

  const title = 'title' in schema.ui ? (schema.ui.title as string) : null
  if (!title) {
    throw new errors.UntitledDeclarationError()
  }

  if (declarationType === 'variable') {
    if (args.length > 0) {
      throw new errors.UnrepresentableGenericError()
    }

    return new Declaration({ type: 'variable', identifier: title, schema })
  }

  return new Declaration({ type: 'type', identifier: title, schema, args })
}
