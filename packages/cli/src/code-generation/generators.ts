import { JSONSchema4 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'

export const jsonSchemaToTypeScriptType = async (jsonSchema: JSONSchema4, name: string): Promise<string> => {
  const code = await compile(jsonSchema, name, { unknownAny: false })
  return code
}

export const stringifySingleLine = (x: object): string => {
  return JSON.stringify(x, null, 1).replace(/\n */g, ' ')
}
