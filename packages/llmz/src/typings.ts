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
  constructor(
    public key: string,
    public value: z.Schema
  ) {}
}

class FnParameters {
  constructor(public schema: z.Schema) {}
}

class FnReturn {
  constructor(public schema: z.Schema) {}
}

class Declaration {
  constructor(
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

  if (options?.declaration) {
    if (schema instanceof z.Schema) {
      const title = 'title' in schema.ui ? (schema.ui.title as string) : null
      if (!title) {
        throw new Error('Only schemas with "title" Zui property can be declared.')
      }

      wrappedSchema = new Declaration(schema, title)
    }
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
  schema: z.Schema | KeyValue | FnParameters | Declaration | null,
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

    if (schema.schema instanceof z.ZodFunction) {
      return stripSpaces(`${description}
declare function ${schema.identifier}${typings};${closingTag}`)
    }

    return stripSpaces(`${description}
declare const ${schema.identifier}: ${typings};${closingTag}`)
  }

  if (schema instanceof KeyValue) {
    if (schema.value instanceof z.ZodOptional) {
      let innerType = schema.value._def.innerType as z.Schema
      if (innerType instanceof z.Schema && !innerType.description && schema.value.description) {
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
    if (schema.schema instanceof z.ZodTuple) {
      let args = ''
      for (let i = 0; i < schema.schema.items.length; i++) {
        const argName = schema.schema.items[i]?.ui?.title ?? `arg${i}`
        const item = schema.schema.items[i]
        args += `${await sUnwrapZodRecursive(new KeyValue(toPropertyKey(argName), item), newOptions)}, `
      }

      return args
    }

    const typings = (await sUnwrapZodRecursive(schema.schema, newOptions)).trim()
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
      return `${await sUnwrapZodRecursive(schema.schema.unwrap(), newOptions)} | undefined`
    }

    return sUnwrapZodRecursive(schema.schema, newOptions)
  }

  if (schema instanceof z.ZodDefault) {
    return sUnwrapZodRecursive(schema._def.innerType, options)
  }

  if (schema instanceof z.ZodVoid) {
    return 'void'
  }

  if (schema instanceof z.ZodUnknown) {
    return 'unknown'
  }

  if (schema instanceof z.ZodAny) {
    return 'any'
  }

  if (schema instanceof z.ZodPromise) {
    return `Promise<${await sUnwrapZodRecursive(schema.unwrap(), newOptions)}>`
  }

  if (schema instanceof z.ZodFunction) {
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

  if (schema instanceof z.ZodArray) {
    const item = await sUnwrapZodRecursive(schema._def.type, newOptions)

    if (isPrimitive(item)) {
      return `${item}[]`
    }

    return `Array<${item}>`
  }

  if (schema instanceof z.ZodEnum) {
    const values = schema._def.values.map(escapeString)
    return values.join(' | ')
  }

  if (schema instanceof z.ZodTuple) {
    if (schema.items.length === 0) {
      return '[]'
    }

    const items = await Promise.all(schema.items.map((i: any) => sUnwrapZodRecursive(i, newOptions)))
    return `[${items.join(', ')}]`
  }

  if (schema instanceof z.ZodNullable) {
    return `${await sUnwrapZodRecursive(schema.unwrap(), options)} | null`
  }

  if (schema instanceof z.ZodOptional) {
    if (options?.declaration || options?.parent instanceof z.ZodRecord) {
      return `${await sUnwrapZodRecursive(schema._def.innerType, newOptions)} | undefined`
    }
    const optionalToken = options.parent instanceof KeyValue ? '| undefined' : ''
    const val = `${await sUnwrapZodRecursive(schema._def.innerType, newOptions)}${optionalToken}`
    return val
  }

  if (schema instanceof z.ZodObject) {
    const props = await Promise.all(
      Object.entries(schema.shape).map(async ([key, value]) => {
        if (value instanceof z.Schema) {
          return sUnwrapZodRecursive(new KeyValue(toPropertyKey(key), value), newOptions)
        }
        return `${key}: unknown`
      })
    )

    return `{ ${props.join('; ')} }`
  }

  if (schema instanceof z.ZodString) {
    const description = getMultilineComment(schema._def.description)
    return `${description} string`.trim()
  }

  if (schema instanceof z.ZodUnion) {
    const description = getMultilineComment(schema._def.description)

    const options = await Promise.all(
      (schema.options as z.ZodSchema[]).map(async (option) => {
        return sUnwrapZodRecursive(option, newOptions)
      })
    )
    return `${description}
${options.join(' | ')}`
  }

  if (schema instanceof z.ZodLiteral) {
    const description = getMultilineComment(schema._def.description)
    return `${description}
${typeof schema.value === 'string' ? escapeString(schema.value) : schema.value}`.trim()
  }

  if (schema instanceof z.ZodNumber) {
    const description = getMultilineComment(schema._def.description)
    return `${description} number`.trim()
  }

  if (schema instanceof z.ZodBoolean) {
    const description = getMultilineComment(schema._def.description)
    return `${description} boolean`.trim()
  }

  if (schema instanceof z.ZodCatch) {
    return sUnwrapZodRecursive(schema.removeCatch(), newOptions)
  }

  if (schema instanceof z.ZodLazy) {
    return sUnwrapZodRecursive(schema._def.getter(), newOptions)
  }

  if (schema instanceof z.ZodRecord) {
    const description = getMultilineComment(schema._def.description)
    const keyType = await sUnwrapZodRecursive(schema._def.keyType, newOptions)
    const valueType = await sUnwrapZodRecursive(schema._def.valueType, newOptions)
    return `${description} { [key: (${keyType})]: (${valueType}) }`
  }

  try {
    let typings = await schema?.toTypescriptAsync()
    typings ??= 'unknown'

    return stripSpaces(typings)
  } catch (error) {
    console.error('Error in sUnwrapZod', { error, schema, parent: options?.parent })
    return 'unknown'
  }
}
