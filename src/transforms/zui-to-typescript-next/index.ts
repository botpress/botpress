import z, { util } from '../../z'
import { escapeString, getMultilineComment, toPropertyKey, toTypeArgumentName } from './utils'

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

export abstract class ZuiToTypescriptError extends Error {}

export class UntitledDeclarationError extends ZuiToTypescriptError {
  constructor(message: string) {
    super(message)
    this.name = 'UntitledDeclarationError'
  }

  static isUntitledDeclarationError(err: Error): err is UntitledDeclarationError {
    return err.name === 'UntitledDeclarationError'
  }
}

export class UnrepresentableGenericError extends ZuiToTypescriptError {
  constructor(message: string) {
    super(message)
    this.name = 'UnrepresentableGenericError'
  }

  static isUnrepresentableGenericError(err: Error): err is UnrepresentableGenericError {
    return err.name === 'UnrepresentableGenericError'
  }
}

const isPrimitive = (type: string) => Primitives.includes(type)
const isArrayOfPrimitives = (type: string) => Primitives.map((p) => `${p}[]`).includes(type)

const stripSpaces = (typings: string) => typings.replace(/ +/g, ' ').trim()

class KeyValue {
  constructor(
    public key: string,
    public value: z.Schema,
    public optional: boolean = false,
  ) {}
}

class FnParameters {
  constructor(public schema: z.Schema) {}
}

class FnReturn {
  constructor(public schema: z.Schema) {}
}

class Declaration {
  constructor(public props: DeclarationProps) {}
}

type DeclarationProps =
  | {
      type: 'variable'
      schema: z.Schema
      identifier: string
    }
  | {
      type: 'type'
      schema: z.Schema
      identifier: string
      args: string[] // type arguments / generics
    }
  | {
      type: 'none'
      schema: z.Schema
    }

export type TypescriptDeclarationType = DeclarationProps['type']
export type TypescriptGenerationOptions = {
  formatter?: (typing: string) => string
} & {
  declaration?: boolean | TypescriptDeclarationType
}

type SchemaTypes = z.Schema | KeyValue | FnParameters | Declaration | null

type InternalOptions = {
  parent?: SchemaTypes
}

export function toTypescript(schema: z.Schema, options: TypescriptGenerationOptions = {}): string {
  const wrappedSchema: Declaration = getDeclarationProps(schema, options)

  let dts = sUnwrapZod(wrappedSchema, {})

  if (options.formatter) {
    dts = options.formatter(dts)
  }

  return dts
}

function sUnwrapZod(schema: z.Schema | KeyValue | FnParameters | Declaration | null, config: InternalOptions): string {
  const newConfig: InternalOptions = {
    ...config,
    parent: schema,
  }

  if (schema === null) {
    return ''
  }

  if (schema instanceof Declaration) {
    return unwrapDeclaration(schema, newConfig)
  }

  if (schema instanceof KeyValue) {
    if (schema.value instanceof z.ZodOptional) {
      let innerType = schema.value._def.innerType as z.Schema
      if (innerType instanceof z.Schema && !innerType.description && schema.value.description) {
        innerType = innerType?.describe(schema.value.description)
      }
      return sUnwrapZod(new KeyValue(schema.key, innerType, true), newConfig)
    }

    const description = getMultilineComment(schema.value._def.description)
    const delimiter = description?.trim().length > 0 ? '\n' : ''
    const withoutDesc = schema.value.describe('')

    // either we are children of a z.ZodOptional or there is a z.ZodOptional in the children
    const isOptional = schema.optional || schema.value.isOptional()
    const optionalModifier = isOptional ? '?' : ''
    return `${delimiter}${description}${delimiter}${schema.key}${optionalModifier}: ${sUnwrapZod(withoutDesc, newConfig)}${delimiter}`
  }

  if (schema instanceof FnParameters) {
    if (schema.schema instanceof z.ZodTuple) {
      let args = ''
      for (let i = 0; i < schema.schema.items.length; i++) {
        const argName = schema.schema.items[i]?.ui?.title ?? `arg${i}`
        const item = schema.schema.items[i]
        args += `${sUnwrapZod(new KeyValue(toPropertyKey(argName), item), newConfig)}${i < schema.schema.items.length - 1 ? ', ' : ''} `
      }

      return args
    }

    const typings = sUnwrapZod(schema.schema, newConfig)

    const startsWithPairs =
      (typings.startsWith('{') && typings.endsWith('}')) ||
      (typings.startsWith('[') && typings.endsWith(']')) ||
      (typings.startsWith('(') && typings.endsWith(')')) ||
      (typings.startsWith('Array<') && typings.endsWith('>')) ||
      (typings.startsWith('Record<') && typings.endsWith('>')) ||
      isArrayOfPrimitives(typings)

    if (startsWithPairs) {
      return `args: ${typings}`
    } else {
      return typings
    }
  }

  if (schema instanceof FnReturn) {
    if (schema.schema instanceof z.ZodOptional) {
      return `${sUnwrapZod(schema.schema.unwrap(), newConfig)} | undefined`
    }

    return sUnwrapZod(schema.schema, newConfig)
  }

  const schemaTyped = schema as z.ZodFirstPartySchemaTypes
  const def = schemaTyped._def

  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return `${getMultilineComment(def.description)} string`.trim()

    case z.ZodFirstPartyTypeKind.ZodNumber:
    case z.ZodFirstPartyTypeKind.ZodNaN:
    case z.ZodFirstPartyTypeKind.ZodBigInt:
      return `${getMultilineComment(def.description)} number`.trim()

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return `${getMultilineComment(schema._def.description)} boolean`.trim()

    case z.ZodFirstPartyTypeKind.ZodDate:
      return `${getMultilineComment(def.description)} Date`.trim()

    case z.ZodFirstPartyTypeKind.ZodUndefined:
      return `${getMultilineComment(def.description)} undefined`.trim()

    case z.ZodFirstPartyTypeKind.ZodNull:
      return `${getMultilineComment(def.description)} null`.trim()

    case z.ZodFirstPartyTypeKind.ZodAny:
      return `${getMultilineComment(def.description)} any`.trim()

    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return `${getMultilineComment(def.description)} unknown`.trim()

    case z.ZodFirstPartyTypeKind.ZodNever:
      return `${getMultilineComment(def.description)} never`.trim()

    case z.ZodFirstPartyTypeKind.ZodVoid:
      return `${getMultilineComment(def.description)} void`.trim()

    case z.ZodFirstPartyTypeKind.ZodArray:
      const item = sUnwrapZod(def.type, newConfig)

      if (isPrimitive(item)) {
        return `${item}[]`
      }

      return `Array<${item}>`

    case z.ZodFirstPartyTypeKind.ZodObject:
      const props = Object.entries((schema as z.ZodObject<any>).shape).map(([key, value]) => {
        if (value instanceof z.Schema) {
          return sUnwrapZod(new KeyValue(toPropertyKey(key), value), newConfig)
        }
        return `${key}: unknown`
      })

      return `{ ${props.join('; ')} }`
    case z.ZodFirstPartyTypeKind.ZodUnion:
      const options = ((schema as z.ZodUnion<any>).options as z.ZodSchema[]).map((option) => {
        return sUnwrapZod(option, newConfig)
      })
      return `${getMultilineComment(def.description)}
${options.join(' | ')}`

    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      const opts = ((schema as z.ZodDiscriminatedUnion<any, any>).options as z.ZodSchema[]).map((option) => {
        return sUnwrapZod(option, newConfig)
      })
      return `${getMultilineComment(schema._def.description)}
${opts.join(' | ')}`

    case z.ZodFirstPartyTypeKind.ZodIntersection:
      return `${sUnwrapZod(def.left, newConfig)} & ${sUnwrapZod(def.right, newConfig)}`

    case z.ZodFirstPartyTypeKind.ZodTuple:
      if (def.items.length === 0) {
        return ''
      }

      const items = def.items.map((i: any) => sUnwrapZod(i, newConfig))
      return `[${items.join(', ')}]`

    case z.ZodFirstPartyTypeKind.ZodRecord:
      const keyType = sUnwrapZod(def.keyType, newConfig)
      const valueType = sUnwrapZod(def.valueType, newConfig)
      return `${getMultilineComment(def.description)} { [key: ${keyType}]: ${valueType} }`

    case z.ZodFirstPartyTypeKind.ZodMap:
      return `Map<${sUnwrapZod(def.keyType, newConfig)}, ${sUnwrapZod(def.valueType, newConfig)}>`

    case z.ZodFirstPartyTypeKind.ZodSet:
      return `Set<${sUnwrapZod(def.valueType, newConfig)}>`

    case z.ZodFirstPartyTypeKind.ZodFunction:
      const input = sUnwrapZod(new FnParameters(def.args), newConfig)
      const output = sUnwrapZod(new FnReturn(def.returns), newConfig)

      return `${getMultilineComment(def.description)}
(${input}) => ${output}`

    case z.ZodFirstPartyTypeKind.ZodLazy:
      return sUnwrapZod(def.getter(), newConfig)

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      if (typeof def.value === 'bigint') {
        throw new Error('BigInt literals are not supported yet')
      }
      const value: string = typeof def.value === 'string' ? escapeString(def.value) : `${def.value}`
      return `${getMultilineComment(def.description)}
${value}`.trim()

    case z.ZodFirstPartyTypeKind.ZodEnum:
      const values = def.values.map(escapeString)
      return values.join(' | ')

    case z.ZodFirstPartyTypeKind.ZodEffects:
      return sUnwrapZod(def.schema, newConfig)

    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      return sUnwrapZod(def.values, newConfig)

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return `${sUnwrapZod(def.innerType, newConfig)} | undefined`

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return `${sUnwrapZod(def.innerType, newConfig)} | null`

    case z.ZodFirstPartyTypeKind.ZodDefault:
      return sUnwrapZod(def.innerType, newConfig)

    case z.ZodFirstPartyTypeKind.ZodCatch:
      return sUnwrapZod((schema as z.ZodCatch<any>).removeCatch(), newConfig)

    case z.ZodFirstPartyTypeKind.ZodPromise:
      return `Promise<${sUnwrapZod((schema as z.ZodPromise<any>).unwrap(), newConfig)}>`

    case z.ZodFirstPartyTypeKind.ZodBranded:
      return sUnwrapZod(def.type, newConfig)

    case z.ZodFirstPartyTypeKind.ZodPipeline:
      return sUnwrapZod(def.in, newConfig)

    case z.ZodFirstPartyTypeKind.ZodSymbol:
      return `${getMultilineComment(def.description)} symbol`.trim()

    case z.ZodFirstPartyTypeKind.ZodReadonly:
      return `readonly ${sUnwrapZod(def.innerType, newConfig)}`

    case z.ZodFirstPartyTypeKind.ZodRef:
      return toTypeArgumentName(def.uri)

    case z.ZodFirstPartyTypeKind.ZodTemplateLiteral:
      const inner = def.parts
        .map((p) => {
          if (typeof p === 'undefined' || p === null) {
            return ''
          }
          if (typeof p === 'string') {
            return p
          }
          if (typeof p === 'boolean' || typeof p === 'number') {
            return `${p}`
          }
          return '${' + sUnwrapZod(p, { ...newConfig }) + '}'
        })
        .join('')

      return `\`${inner}\``

    default:
      util.assertNever(def)
  }
}

const unwrapDeclaration = (declaration: Declaration, options: InternalOptions): string => {
  if (declaration.props.type === 'none') {
    return sUnwrapZod(declaration.props.schema, options)
  }

  const description = getMultilineComment(declaration.props.schema.description)
  const withoutDesc = declaration.props.schema.describe('')
  const typings = sUnwrapZod(withoutDesc, options)

  if (declaration.props.type === 'variable') {
    return stripSpaces(`${description}declare const ${declaration.props.identifier}: ${typings};`)
  }

  const generics =
    declaration.props.args.length > 0 ? `<${declaration.props.args.map(toTypeArgumentName).join(', ')}>` : ''
  return stripSpaces(`${description}type ${declaration.props.identifier}${generics} = ${typings};`)
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

const getDeclarationProps = (schema: z.Schema, options: TypescriptGenerationOptions): Declaration => {
  const declarationType = getDeclarationType(options)
  const args = schema.getReferences()

  if (declarationType === 'none') {
    if (args.length > 0) {
      throw new UnrepresentableGenericError(
        'ZodRefs are only supported when generating "type" declaration. Please set "declaration" option to "type".',
      )
    }

    return new Declaration({ type: 'none', schema })
  }

  const title = 'title' in schema.ui ? (schema.ui.title as string) : null
  if (!title) {
    throw new UntitledDeclarationError('Only schemas with "title" Zui property can be declared.')
  }

  if (declarationType === 'variable') {
    if (args.length > 0) {
      throw new UnrepresentableGenericError(
        'ZodRefs are only supported when generating "type" declaration. Please set "declaration" option to "type".',
      )
    }

    return new Declaration({ type: 'variable', identifier: title, schema })
  }

  return new Declaration({ type: 'type', identifier: title, schema, args })
}
