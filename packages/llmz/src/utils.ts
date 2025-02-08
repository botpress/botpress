import { type TextTokenizer, getWasmTokenizer } from '@bpinternal/thicktoken'
import { JSONSchema, z } from '@bpinternal/zui'
import { pickBy, startCase, camelCase, isPlainObject, deburr } from 'lodash-es'

let tokenizer: TextTokenizer = null!

export const init = async () => {
  if (tokenizer) {
    return
  }

  while (typeof getWasmTokenizer !== 'function') {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  tokenizer = (await getWasmTokenizer()) as TextTokenizer
}

export const getTokenizer = () => {
  if (!tokenizer) {
    throw new Error('Tokenizer not initialized, make sure to call init() first and await it')
  }

  return tokenizer
}

export const Tokens = (min: number, max: number) => {
  return z.string().superRefine((value, ctx) => {
    const tokens = tokenizer.count(value)

    if (value.length < min) {
      ctx.addIssue({
        code: 'too_small',
        minimum: min,
        type: 'string',
        message: `Text is ${tokens} but expected at least ${min} tokens`,
        inclusive: true,
      })
    }

    if (value.length > max) {
      ctx.addIssue({
        code: 'too_big',
        maximum: max,
        type: 'string',
        message: `Text is ${tokens} tokens but expected at most ${max} tokens`,
        inclusive: true,
      })
    }

    return value
  })
}

export const Identifier = z
  .string()
  .min(1)
  .max(100)
  // must start with a letter and can only contain letters, numbers and underscores
  .regex(
    /^([a-zA-Z_][a-zA-Z0-9_]*)$/,
    'Identifiers must start with a letter and can only contain letters, numbers and underscores'
  )

export function escapeString(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }

  // Use String.raw to get the raw string with escapes preserved
  const rawStr = String.raw`${str}`

  // Escape newlines and other special characters
  const escapedStr = rawStr.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"').replace(/'/g, "\\'")

  // Determine the appropriate quote style
  if (escapedStr.includes('`')) {
    return `"${escapedStr}"`
  } else if (escapedStr.includes("'")) {
    return `"${escapedStr}"`
  } else {
    return `'${escapedStr}'`
  }
}

export const toPropertyKey = (key: string) => {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key
  }

  return escapeString(key)
}

const trimEmptyLines = (lines: string[]) => {
  while (lines.length && !lines[0]?.trim()) {
    lines.shift()
  }

  while (lines.length && !lines[lines.length - 1]!.trim()) {
    lines.pop()
  }
}

export const getMultilineComment = (description?: string) => {
  // Remove too many empty lines (more than 2)
  description = description?.replace(/(\n(\s*)?){3,}/g, '\n\n')

  const ensureLineStartsWithAsterisk = (line: string) => (line.startsWith('* ') ? ` ${line}` : ` * ${line}`)
  const escapeCommentEnd = (line: string) => line.replace(/\*\//g, '*\\/')

  const descLines = (description ?? '').split('\n').map((line) => line.trim())

  trimEmptyLines(descLines)

  if (descLines.length) {
    descLines[0] = descLines[0]!.replace(/^\/\*\*?/, '')
    descLines[descLines.length - 1] = descLines[descLines.length - 1]!.replace(/\*\/$/, '')
  }

  trimEmptyLines(descLines)

  return descLines.length === 0
    ? ''
    : descLines.length === 1
      ? `/** ${escapeCommentEnd(descLines[0]!)} */`
      : `/**\n${descLines.map(ensureLineStartsWithAsterisk).map(escapeCommentEnd).join('\n')}\n */`
}

export const toValidFunctionName = (str: string) => {
  let name = deburr(str)
  name = name.replace(/[^a-zA-Z0-9_$]/g, '')

  if (!/^[a-zA-Z_$]/.test(name)) {
    name = `_${name}`
  }

  return camelCase(name)
}

export const awaitObject = async <T extends {}>(obj: T): Promise<T> => {
  const newObj: any = { ...obj }
  const promises: Promise<void>[] = []

  const setProp = async (key: string, value: unknown) => {
    newObj[key] = await value
  }

  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Promise) {
      promises.push(setProp(key, value))
    } else if (isPlainObject(value)) {
      promises.push(setProp(key, await awaitObject(value as {})))
    }
  }

  await Promise.all(promises)

  return newObj
}

export const toValidObjectName = (str: string) => {
  let name = deburr(str)
  name = name
    .split(/[^a-zA-Z0-9_$]/g)
    .map(startCase)
    .join('')

  if (!/^[a-zA-Z_$]/.test(name)) {
    name = `_${name}`
  }
  return name.replaceAll(' ', '')
}

export const stripInvalidIdentifiers = (object: unknown): any => {
  if (typeof object !== 'object') {
    return object
  }

  if (Array.isArray(object)) {
    return object.map(stripInvalidIdentifiers)
  }

  return pickBy(object, (__, key) => Identifier.safeParse(key).success)
}

/**
 * Transforms a Zui schema to narrow it down to literal values when they are manually provided by the user
 */
export const convertObjectToZuiLiterals = (obj: unknown, nested = false): any => {
  if (typeof obj === 'string') {
    return z.literal(obj).catch(() => obj)
  }

  if (typeof obj === 'number') {
    return z.literal(obj).catch(() => obj)
  }

  if (typeof obj === 'boolean') {
    return z.literal(obj).catch(() => obj)
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return z.tuple([]).catch(() => obj as any)
    }
    return z
      .tuple([
        // the tuple needs to have at least one element
        convertObjectToZuiLiterals(obj[0]),
        ...obj.slice(1).map((child) => convertObjectToZuiLiterals(child)),
      ])
      .catch(() => obj as any)
  }

  if (obj !== null && typeof obj === 'object') {
    const shape: { [key: string]: z.ZodTypeAny } = {}
    for (const key in obj) {
      shape[key] = convertObjectToZuiLiterals((obj as any)[key], true)
    }
    if (nested) {
      return z.object(shape).catch(() => shape)
    }
    return shape
  }

  if (obj === undefined) {
    return z.undefined().catch(() => undefined)
  }

  if (obj === null) {
    return z.null().catch(() => null)
  }

  throw new Error(`Unsupported object type ${typeof obj}, ${obj})`)
}

export const isValidSchema = (schema: JSONSchema): boolean => {
  try {
    z.fromJsonSchema(schema)
    return typeof schema.type === 'string'
  } catch {
    return false
  }
}

export function isJsonSchema(schema: unknown): schema is JSONSchema {
  return !!schema && typeof schema === 'object' && ('$schema' in schema || 'type' in schema || 'properties' in schema)
}

export function isValidIdentifier(name: string): boolean {
  if (typeof name !== 'string') {
    return false
  }

  return /^[A-Z]{1,}[A-Z0-9_]{0,50}$/i.test(name)
}
