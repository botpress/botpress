import { transforms, z } from '@bpinternal/zui'
import { formatTypings } from './formatting.js'
import { fromJSONSchemaCompat, getMultilineComment, toPropertyKey } from './utils.js'

export type Options = {
  declaration?: boolean
}

/** One schema renderer for API inputs, results, and memory properties. */
export function schemaToTypeScript(schema: z.Schema): string {
  if (z.is.zuiDefault(schema)) {
    return schemaToTypeScript(schema._def.innerType as z.Schema)
  }

  const options = { treatDefaultAsOptional: true }

  try {
    return transforms.toTypescriptType(schema, options)
  } catch {
    // Zui's JSON Schema adapter normalizes variants such as native enums.
    const normalized = fromJSONSchemaCompat(transforms.toJSONSchemaLegacy(schema))

    return transforms.toTypescriptType(normalized, options)
  }
}

function describeParameter(parameter: z.Schema, index: number): string {
  const name = toPropertyKey((parameter.ui?.title as string) ?? `arg${index}`)
  const optional = z.is.zuiOptional(parameter) || z.is.zuiDefault(parameter)
  let value = parameter

  while (z.is.zuiOptional(value) || z.is.zuiDefault(value)) {
    value = value._def.innerType as z.Schema
  }

  return `${getMultilineComment(parameter.description)}${name}${optional ? '?' : ''}: ${schemaToTypeScript(value.describe(''))}`
}

/** Preserve declaration names and parameter labels; Zui renders every value type. */
export async function getTypings(schema: z.Schema, options: Options = {}): Promise<string> {
  if (!options.declaration) {
    return formatTypings(schemaToTypeScript(schema), { throwOnError: false })
  }

  const title = schema.ui?.title

  if (typeof title !== 'string' || !title) {
    throw new Error('Only schemas with "title" Zui property can be declared.')
  }

  const description = getMultilineComment(schema.description)
  let declaration: string

  if (z.is.zuiFunction(schema)) {
    const input = schema.parameters()
    const parameters = z.is.zuiTuple(input)
      ? input.items.map(describeParameter).join(', ')
      : `args: ${schemaToTypeScript(input)}`
    const result = schemaToTypeScript(schema.returnType())

    declaration = `declare function ${title}(${parameters}): ${result};`
  } else {
    declaration = `declare const ${title}: ${schemaToTypeScript(schema.describe(''))};`
  }

  return formatTypings(`${description}\n${declaration}`, { throwOnError: false })
}
