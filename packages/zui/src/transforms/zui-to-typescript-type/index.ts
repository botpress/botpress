import z from '../../z'
import * as utils from '../../z/utils'
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
    public value: z.ZodBaseType
  ) {}
}

class FnParameters {
  constructor(public schema: z.ZodBaseType) {}
}

class FnReturn {
  constructor(public schema: z.ZodBaseType) {}
}

class Declaration {
  constructor(public props: DeclarationProps) {}
}

type DeclarationProps =
  | {
      type: 'variable'
      schema: z.ZodBaseType
      identifier: string
    }
  | {
      type: 'type'
      schema: z.ZodBaseType
      identifier: string
      args: string[] // type arguments / generics
    }
  | {
      type: 'none'
      schema: z.ZodBaseType
    }

export type TypescriptDeclarationType = DeclarationProps['type']
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

type SchemaTypes = z.ZodBaseType | KeyValue | FnParameters | Declaration | null

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
export function toTypescriptType(schema: z.ZodBaseType, options: TypescriptGenerationOptions = {}): string {
  const wrappedSchema: Declaration = getDeclarationProps(schema, options)

  let dts = sUnwrapZod(wrappedSchema, options)

  if (options.formatter) {
    dts = options.formatter(dts)
  }

  return dts
}

const _optionalKey = (key: string): string => (key.endsWith('?') ? key : `${key}?`)

function sUnwrapZod(
  schema: z.ZodBaseType | KeyValue | FnParameters | Declaration | null,
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
    return unwrapDeclaration(schema, newConfig)
  }

  if (schema instanceof KeyValue) {
    let optionalValue: z.ZodOptional | undefined = undefined

    const schemaValue = schema.value as z.ZodType
    if (schemaValue.typeName === 'ZodOptional') {
      optionalValue = schemaValue
    } else if (schemaValue.typeName === 'ZodDefault' && config.treatDefaultAsOptional) {
      optionalValue = schemaValue._def.innerType.optional()
    }

    if (optionalValue) {
      let innerType = optionalValue._def.innerType
      if (z.isZuiType(innerType) && !innerType.description && optionalValue.description) {
        innerType = innerType?.describe(optionalValue.description)
      }

      return sUnwrapZod(new KeyValue(_optionalKey(schema.key), innerType), newConfig)
    }

    const description = getMultilineComment(schema.value._def.description || schema.value.description)
    const delimiter = description?.trim().length > 0 ? '\n' : ''
    const withoutDesc = schema.value.describe('')

    const isOptional = (schema.value as z.ZodType).typeName === 'ZodAny' // any is treated as optional for backwards compatibility
    const key = isOptional ? _optionalKey(schema.key) : schema.key
    return `${delimiter}${description}${delimiter}${key}: ${sUnwrapZod(withoutDesc, newConfig)}${delimiter}`
  }

  if (schema instanceof FnParameters) {
    const schemaSchema = schema.schema as z.ZodType
    if (schemaSchema.typeName === 'ZodTuple') {
      let args = ''
      for (let i = 0; i < schemaSchema.items.length; i++) {
        const argName = (schemaSchema.items[i]?.ui?.title as string) ?? `arg${i}`
        const item = schemaSchema.items[i]!
        args += `${sUnwrapZod(new KeyValue(toPropertyKey(argName), item), newConfig)}${
          i < schemaSchema.items.length - 1 ? ', ' : ''
        } `
      }

      return args
    }

    const isLiteral = (schema.schema.naked() as z.ZodType).typeName === 'ZodLiteral'

    const typings = sUnwrapZod(schema.schema, newConfig).trim()
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
    const schemaSchema = schema.schema as z.ZodType
    if (schemaSchema.typeName === 'ZodOptional') {
      return `${sUnwrapZod(schemaSchema.unwrap(), newConfig)} | undefined`
    }

    return sUnwrapZod(schemaSchema, newConfig)
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
      const item = sUnwrapZod(s._def.type, newConfig)

      if (isPrimitive(item)) {
        return `${item}[]`
      }

      return `Array<${item}>`

    case 'ZodObject':
      const props = Object.entries(s._def.shape()).map(([key, value]) => {
        if (z.isZuiType(value)) {
          return sUnwrapZod(new KeyValue(toPropertyKey(key), value), newConfig)
        }
        return `${key}: unknown`
      })

      return `{ ${props.join('; ')} }`

    case 'ZodUnion':
      const options = s._def.options.map((option) => {
        return sUnwrapZod(option, newConfig)
      })
      return `${getMultilineComment(s.description)}
${options.join(' | ')}`

    case 'ZodDiscriminatedUnion':
      const opts = s._def.options.map((option) => {
        return sUnwrapZod(option, newConfig)
      })
      return `${getMultilineComment(s.description)}
${opts.join(' | ')}`

    case 'ZodIntersection':
      return `${sUnwrapZod(s._def.left, newConfig)} & ${sUnwrapZod(s._def.right, newConfig)}`

    case 'ZodTuple':
      if (s._def.items.length === 0) {
        return '[]'
      }

      const items = s._def.items.map((i: any) => sUnwrapZod(i, newConfig))
      return `[${items.join(', ')}]`

    case 'ZodRecord':
      const keyType = sUnwrapZod(s._def.keyType, newConfig)
      const valueType = sUnwrapZod(s._def.valueType, newConfig)
      return `${getMultilineComment(s.description)} { [key: ${keyType}]: ${valueType} }`

    case 'ZodMap':
      return `Map<${sUnwrapZod(s._def.keyType, newConfig)}, ${sUnwrapZod(s._def.valueType, newConfig)}>`

    case 'ZodSet':
      return `Set<${sUnwrapZod(s._def.valueType, newConfig)}>`

    case 'ZodFunction':
      const input = sUnwrapZod(new FnParameters(s._def.args), newConfig)
      const output = sUnwrapZod(new FnReturn(s._def.returns), newConfig)
      const parentIsType = config?.parent instanceof Declaration && config?.parent.props.type === 'type'

      if (config?.declaration && !parentIsType) {
        return `${getMultilineComment(s.description)}
(${input}): ${output}`
      }

      return `${getMultilineComment(s.description)}
(${input}) => ${output}`

    case 'ZodLazy':
      return sUnwrapZod(s._def.getter(), newConfig)

    case 'ZodLiteral':
      const value: string = primitiveToTypscriptLiteralType(s._def.value)
      return `${getMultilineComment(s.description)}
${value}`.trim()

    case 'ZodEnum':
      const values = s._def.values.map(primitiveToTypescriptValue)
      return values.join(' | ')

    case 'ZodEffects':
      return sUnwrapZod(s._def.schema, newConfig)

    case 'ZodNativeEnum':
      throw new errors.UnsupportedZuiToTypescriptTypeError('ZodNativeEnum')

    case 'ZodOptional':
      return `${sUnwrapZod(s._def.innerType, newConfig)} | undefined`

    case 'ZodNullable':
      return `${sUnwrapZod(s._def.innerType, newConfig)} | null`

    case 'ZodDefault':
      const defaultInnerType = config.treatDefaultAsOptional ? s._def.innerType.optional() : s._def.innerType
      return sUnwrapZod(defaultInnerType, newConfig)

    case 'ZodCatch':
      return sUnwrapZod(s._def.innerType, newConfig)

    case 'ZodPromise':
      return `Promise<${sUnwrapZod(s._def.type, newConfig)}>`

    case 'ZodBranded':
      return sUnwrapZod(s._def.type, newConfig)

    case 'ZodPipeline':
      return sUnwrapZod(s._def.in, newConfig)

    case 'ZodSymbol':
      return `${getMultilineComment(s.description)} symbol`.trim()

    case 'ZodReadonly':
      return `Readonly<${sUnwrapZod(s._def.innerType, newConfig)}>`

    case 'ZodRef':
      return toTypeArgumentName(s._def.uri)

    default:
      utils.assert.assertNever(s)
  }
}

const unwrapDeclaration = (declaration: Declaration, options: InternalOptions): string => {
  if (declaration.props.type === 'none') {
    return sUnwrapZod(declaration.props.schema, options)
  }

  const { schema, identifier } = declaration.props
  const description = getMultilineComment(schema.description)
  const withoutDesc = schema.describe('')
  const typings = sUnwrapZod(withoutDesc, { ...options, declaration: true })

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

const getDeclarationProps = (schema: z.ZodBaseType, options: TypescriptGenerationOptions): Declaration => {
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
