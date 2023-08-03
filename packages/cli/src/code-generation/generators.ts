import type { JSONSchema4, JSONSchema7 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'
import { jsonSchemaToZod } from 'json-schema-to-zod'

export const jsonSchemaToTypeScriptType = (schema: JSONSchema4, name: string): Promise<string> => {
  return compile(schema, name)
}

export const jsonSchemaToTypeScriptZod = async (schema: JSONSchema7, name: string): Promise<string> => {
  let code = jsonSchemaToZod(schema, { name })
  code = code.replace(/\.catchall\(z\.never\(\)\)/g, '.strict()')
  return code
}
