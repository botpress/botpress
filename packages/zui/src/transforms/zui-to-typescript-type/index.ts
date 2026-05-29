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

type InternalOptions = {
  parent?: SchemaTypes
  declaration?: boolean | TypescriptDeclarationType
  includeClosingTags?: boolean
  treatDefaultAsOptional?: boolean
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

  let dts = sUnwrapZod(wrappedSchema, path, options)

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
  }

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
    const withoutDesc = schema.value.describe('')

    const isOptional = z.is.zuiAny(schema.value) // any is treated as optional for backwards compatibility
    const key = isOptional ? _optionalKey(schema.key) : schema.key
    return `${delimiter}${description}${delimiter}${key}: ${sUnwrapZod(withoutDesc, path, newConfig)}${delimiter}`
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

  switch (s.typeName) {
    case 'ZodString':
      return `${getMultilineComment(s.description)} string`.trim()

    case 'ZodNumber':
    case 'ZodNaN':
    case 'ZodBigInt':
      return `${getMultilineComment(s.description)} number`.trim()

    case 'ZodBoolean':
      return `${getMultilineComment(s.description)} boolean`.trim()

    case 'ZodDate':
      return `${getMultilineComment(s.description)} Date`.trim()

    case 'ZodUndefined':
      return `${getMultilineComment(s.description)} undefined`.trim()

    case 'ZodNull':
      return `${getMultilineComment(s.description)} null`.trim()

    case 'ZodAny':
      return `${getMultilineComment(s.description)} any`.trim()

    case 'ZodUnknown':
      return `${getMultilineComment(s.description)} unknown`.trim()

    case 'ZodNever':
      return `${getMultilineComment(s.description)} never`.trim()

    case 'ZodVoid':
      return `${getMultilineComment(s.description)} void`.trim()

    case 'ZodArray':
      const item = sUnwrapZod(s._def.type, path.withIndexType('number'), newConfig)

      if (isPrimitive(item)) {
        return `${item}[]`
      }

      return `Array<${item}>`

    case 'ZodObject':
      const props = Object.entries(s._def.shape()).map(([key, value]) => {
        if (z.is.zuiType(value)) {
          return sUnwrapZod(new KeyValue(toPropertyKey(key), value), path.withIndexType('key', key), newConfig)
        }
        return `${key}: unknown`
      })

      return `{ ${props.join('; ')} }`

    case 'ZodUnion':
      const options = s._def.options.map((option, index) => {
        return sUnwrapZod(option, path.withIndexType('number', index), newConfig)
      })
      return `${getMultilineComment(s.description)}
${options.join(' | ')}`

    case 'ZodDiscriminatedUnion':
      const opts = s._def.options.map((option, index) => {
        return sUnwrapZod(option, path.withIndexType('number', index), newConfig)
      })
      return `${getMultilineComment(s.description)}
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
      return `${getMultilineComment(s.description)} { [key: ${keyType}]: ${valueType} }`
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
        return `${getMultilineComment(s.description)}
(${input}): ${output}`
      }

      return `${getMultilineComment(s.description)}
(${input}) => ${output}`

    case 'ZodLazy':
      return sUnwrapZod(s._def.getter(), path, newConfig)

    case 'ZodLiteral':
      const value: string = primitiveToTypscriptLiteralType(s._def.value)
      return `${getMultilineComment(s.description)}
${value}`.trim()

    case 'ZodEnum':
      const values = s._def.values.map(primitiveToTypescriptValue)
      return values.join(' | ')

    case 'ZodEffects':
      return sUnwrapZod(s._def.schema, path, newConfig)

    case 'ZodNativeEnum':
      throw new errors.UnsupportedZuiToTypescriptTypeError('ZodNativeEnum', path.toString())

    case 'ZodOptional':
      return `${sUnwrapZod(s._def.innerType, path, newConfig)} | undefined`

    case 'ZodNullable':
      return `${sUnwrapZod(s._def.innerType, path, newConfig)} | null`

    case 'ZodDefault':
      const defaultInnerType = config.treatDefaultAsOptional ? s._def.innerType.optional() : s._def.innerType
      return sUnwrapZod(defaultInnerType, path, newConfig)

    case 'ZodCatch':
      return sUnwrapZod(s._def.innerType, path, newConfig)

    case 'ZodPromise':
      return `Promise<${sUnwrapZod(s._def.type, path, newConfig)}>`

    case 'ZodBranded':
      return sUnwrapZod(s._def.type, path, newConfig)

    case 'ZodPipeline':
      return sUnwrapZod(s._def.in, path, newConfig)

    case 'ZodSymbol':
      return `${getMultilineComment(s.description)} symbol`.trim()

    case 'ZodReadonly':
      return `Readonly<${sUnwrapZod(s._def.innerType, path, newConfig)}>`

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
  const withoutDesc = schema.describe('')
  const typings = sUnwrapZod(withoutDesc, path, { ...options, declaration: true })

  const isLargeDeclaration = typings.split('\n').length >= LARGE_DECLARATION_LINES
  const closingTag = isLargeDeclaration && options.includeClosingTags ? `// end of ${identifier}` : ''

  if (declaration.props.type !== 'type' && schema.typeName === 'ZodFunction') {
    return stripSpaces(`${description}
declare function ${identifier}${typings};${closingTag}`)
  }

  if (declaration.props.type === 'variable') {
    return stripSpaces(`${description}declare const ${identifier}: ${typings};${closingTag}`)
  }

  const generics =
    declaration.props.args.length > 0 ? `<${declaration.props.args.map(toTypeArgumentName).join(', ')}>` : ''
  return stripSpaces(`${description}type ${declaration.props.identifier}${generics} = ${typings};${closingTag}`)
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
