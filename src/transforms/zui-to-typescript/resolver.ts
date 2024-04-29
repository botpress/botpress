import type { ParserOptions } from '@apidevtools/json-schema-ref-parser'
import { type JSONSchema } from './types/JSONSchema'
import { log } from './utils'

export type DereferencedPaths = WeakMap<JSONSchema, string>

export async function dereference(
  schema: JSONSchema,
  { cwd, $refOptions }: { cwd: string; $refOptions: ParserOptions },
): Promise<{ dereferencedPaths: DereferencedPaths; dereferencedSchema: JSONSchema }> {
  log('green', 'dereferencer', 'Dereferencing input schema:', cwd, schema)
  if (typeof process === 'undefined') {
    throw new Error('process is not defined')
  }
  const mod = await import('@apidevtools/json-schema-ref-parser')
  const parser = new mod.$RefParser()
  const dereferencedPaths: DereferencedPaths = new WeakMap()
  const dereferencedSchema = (await parser.dereference(cwd, schema as any, {
    ...$refOptions,
    dereference: {
      ...$refOptions.dereference,
      onDereference($ref: string, schema: JSONSchema) {
        dereferencedPaths.set(schema, $ref)
      },
    },
  })) as JSONSchema
  return { dereferencedPaths, dereferencedSchema }
}
