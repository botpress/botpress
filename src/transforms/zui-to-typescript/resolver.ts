import $RefParser, { ParserOptions } from '@apidevtools/json-schema-ref-parser'
import { type JSONSchema } from './types/JSONSchema'
import { log } from './utils'

export type DereferencedPaths = WeakMap<JSONSchema, string>

export async function dereference(
  schema: JSONSchema,
  { cwd, $refOptions }: { cwd: string; $refOptions: ParserOptions },
): Promise<{ dereferencedPaths: DereferencedPaths; dereferencedSchema: JSONSchema }> {
  log('green', 'dereferencer', 'Dereferencing input schema:', cwd, schema)
  const parser = new $RefParser()
  const dereferencedPaths: DereferencedPaths = new WeakMap()
  const dereferencedSchema = (await parser.dereference(cwd, schema as any, {
    ...$refOptions,
    dereference: {
      ...$refOptions.dereference,
      onDereference($ref: string, schema: JSONSchema) {
        dereferencedPaths.set(schema, $ref)
      },
    },
  })) as any // TODO: fix types
  return { dereferencedPaths, dereferencedSchema }
}
