import { z } from '@bpinternal/zui'

import { formatTypings } from './formatting.js'
import { escapeString, getMultilineComment, toPropertyKey } from './utils.js'

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
  public constructor(
    public key: string,
    public value: z.Schema
  ) {}
}

class FnParameters {
  public constructor(public schema: z.Schema) {}
}

class FnReturn {
  public constructor(public schema: z.Schema) {}
}

class Declaration {
  public constructor(
    public schema: z.Schema,
    public identifier: string
  ) {}
}

export type Options = {
  declaration?: boolean
}

type SchemaTypes = z.Schema | KeyValue | FnParameters | Declaration | null

type InternalOptions = Options & {
  parent?: SchemaTypes
}

export async function getTypings(schema: z.Schema, options?: Options): Promise<string> {
  options ??= {}
  options.declaration ??= false

  let wrappedSchema: z.Schema | Declaration = schema

  if (options?.declaration && z.is.zuiType(schema)) {
    const title = 'title' in schema.ui ? (schema.ui.title as string) : null
    if (!title) {
      throw new Error('Only schemas with "title" Zui property can be declared.')
    }

    wrappedSchema = new Declaration(schema, title)
  }
  let dts = await sUnwrapZodRecursive(wrappedSchema, { ...options })
  dts = await formatTypings(dts, { throwOnError: false })

  return dts
}

async function sUnwrapZodRecursive(
  schema: z.Schema | KeyValue | FnParameters | Declaration | null,
  options: InternalOptions
): Promise<string> {
  return sUnwrapZod(schema, options)
}

async function sUnwrapZod(
  schema: z.ZodType | KeyValue | FnParameters | Declaration | null,
  options: InternalOptions
): Promise<string> {
  const newOptions = {
    ...options,
    declaration: false,
    parent: schema,
  }

  if (schema instanceof Declaration) {
    const description = getMultilineComment(schema.schema.description)
    const withoutDesc = schema.schema.describe('')
    const typings = await sUnwrapZodRecursive(withoutDesc, { ...newOptions, declaration: true })

    const isLargeDeclaration = typings.split('\n').length >= LARGE_DECLARATION_LINES
    const closingTag = isLargeDeclaration ? `// end of ${schema.identifier}` : ''

    if (z.is.zuiFunction(schema.schema)) {
      return stripSpaces(`${description}
declare function ${schema.identifier}${typings};${closingTag}`)
    }

    return stripSpaces(`${description}
declare const ${schema.identifier}: ${typings};${closingTag}`)
  }

  if (schema instanceof KeyValue) {
    if (z.is.zuiOptional(schema.value) || z.is.zuiDefault(schema.value)) {
      let innerType = schema.value._def.innerType as z.Schema
      if (z.is.zuiType(innerType) && !innerType.description && schema.value.description) {
        innerType = innerType?.describe(schema.value.description)
      }
      const optionalToken = schema.key.endsWith('?') ? '' : '?'
      return sUnwrapZodRecursive(new KeyValue(schema.key + optionalToken, innerType), newOptions)
    }

    const description = getMultilineComment(schema.value._def.description || schema.value.description)
    const delimiter = description?.trim().length > 0 ? '\n' : ''
    const withoutDesc = schema.value.describe('')

    return `${delimiter}${description}${delimiter}${schema.key}: ${await sUnwrapZodRecursive(withoutDesc, newOptions)}${delimiter}`
  }

  if (schema instanceof FnParameters) {
    if (z.is.zuiTuple(schema.schema)) {
      let args = ''
      for (let i = 0; i < schema.schema.items.length; i++) {
        const argName = (schema.schema.items[i]?.ui?.title as string) ?? `arg${i}`
        const item = schema.schema.items[i]!
        args += `${await sUnwrapZodRecursive(new KeyValue(toPropertyKey(argName), item), newOptions)}, `
      }

      return args
    }

    const isLiteral = z.is.zuiLiteral(schema.schema.naked())

    const typings = (await sUnwrapZodRecursive(schema.schema, newOptions)).trim()
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
      return `${await sUnwrapZodRecursive(schema.schema.unwrap(), newOptions)} | undefined`
    }

    return sUnwrapZodRecursive(schema.schema, newOptions)
  }

  if (schema === null) {
    return 'unknown'
  }

  schema satisfies z.ZodType

  if (z.is.zuiDefault(schema)) {
    return sUnwrapZodRecursive(schema._def.innerType, options)
  }

  if (z.is.zuiVoid(schema)) {
    return 'void'
  }

  if (z.is.zuiUnknown(schema)) {
    return 'unknown'
  }

  if (z.is.zuiAny(schema)) {
    return 'any'
  }

  if (z.is.zuiPromise(schema)) {
    return `Promise<${await sUnwrapZodRecursive(schema.unwrap(), newOptions)}>`
  }

  if (z.is.zuiFunction(schema)) {
    const description = getMultilineComment(schema._def.description)
    const input = await sUnwrapZodRecursive(new FnParameters(schema._def.args), newOptions)
    const output = await sUnwrapZodRecursive(new FnReturn(schema._def.returns), newOptions)

    if (options?.declaration) {
      return `${description}
(${input}): ${output}`
    }

    return `${description}
(${input}) => ${output}`
  }

  if (z.is.zuiArray(schema)) {
    const item = await sUnwrapZodRecursive(schema._def.type, newOptions)

    if (isPrimitive(item)) {
      return `${item}[]`
    }

    return `Array<${item}>`
  }

  if (z.is.zuiEnum(schema)) {
    const values = schema._def.values.map(escapeString)
    return values.join(' | ')
  }

  if (z.is.zuiTuple(schema)) {
    if (schema.items.length === 0) {
      return '[]'
    }

    const items = await Promise.all(schema.items.map((i: any) => sUnwrapZodRecursive(i, newOptions)))
    return `[${items.join(', ')}]`
  }

  if (z.is.zuiNullable(schema)) {
    return `${await sUnwrapZodRecursive(schema.unwrap(), options)} | null`
  }

  if (z.is.zuiOptional(schema)) {
    if (options?.declaration || (z.is.zuiType(options?.parent) && options.parent.typeName === 'ZodRecord')) {
      return `${await sUnwrapZodRecursive(schema._def.innerType, newOptions)} | undefined`
    }
    const optionalToken = options.parent instanceof KeyValue ? '| undefined' : ''
    const val = `${await sUnwrapZodRecursive(schema._def.innerType, newOptions)}${optionalToken}`
    return val
  }

  if (z.is.zuiObject(schema)) {
    const props = await Promise.all(
      Object.entries(schema.shape).map(async ([key, value]) => {
        if (z.is.zuiType(value)) {
          return sUnwrapZodRecursive(new KeyValue(toPropertyKey(key), value), newOptions)
        }
        return `${key}: unknown`
      })
    )

    return `{ ${props.join('; ')} }`
  }

  if (z.is.zuiString(schema)) {
    const description = getMultilineComment(schema._def.description)
    return `${description} string`.trim()
  }

  if (z.is.zuiUnion(schema)) {
    const description = getMultilineComment(schema._def.description)

    const options = await Promise.all(
      (schema.options as readonly z.ZodSchema[]).map(async (option) => {
        return sUnwrapZodRecursive(option, newOptions)
      })
    )
    return `${description}
${options.join(' | ')}`
  }

  if (z.is.zuiLiteral(schema)) {
    const description = getMultilineComment(schema._def.description)
    return `${description}
${typeof schema.value === 'string' ? escapeString(schema.value) : String(schema.value)}`.trim()
  }

  if (z.is.zuiNumber(schema)) {
    const description = getMultilineComment(schema._def.description)
    return `${description} number`.trim()
  }

  if (z.is.zuiBoolean(schema)) {
    const description = getMultilineComment(schema._def.description)
    return `${description} boolean`.trim()
  }

  if (z.is.zuiCatch(schema)) {
    return sUnwrapZodRecursive(schema.removeCatch(), newOptions)
  }

  if (z.is.zuiLazy(schema)) {
    return sUnwrapZodRecursive(schema._def.getter(), newOptions)
  }

  if (z.is.zuiRecord(schema)) {
    const description = getMultilineComment(schema._def.description)
    const keyType = await sUnwrapZodRecursive(schema._def.keyType, newOptions)
    const valueType = await sUnwrapZodRecursive(schema._def.valueType, newOptions)
    return `${description} { [key: (${keyType})]: (${valueType}) }`
  }

  try {
    let typings = schema?.toTypescriptType({ treatDefaultAsOptional: true })
    typings ??= 'unknown'

    return stripSpaces(typings)
  } catch (error) {
    console.error('Error in sUnwrapZod', { error, schema, parent: options?.parent })
    return 'unknown'
  }
}
