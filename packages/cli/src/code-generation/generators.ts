import { JSONSchema4, JSONSchema7 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'
import { jsonSchemaToZod } from 'json-schema-to-zod'
import { z } from 'zod'
import * as utils from '../utils'

export const zodToTypeScriptType = async (schema: z.ZodObject<any>, name: string): Promise<string> => {
  // TODO: pass directly from zod to typescript with [zod-to-ts](https://www.npmjs.com/package/zod-to-ts)
  const jsonSchema = utils.schema.mapZodToJsonSchema({ schema }) as JSONSchema4
  const code = await compile(jsonSchema, name)
  return code
}

export const jsonSchemaToTypeScriptZod = async (schema: JSONSchema7, name: string): Promise<string> => {
  let code = jsonSchemaToZod(schema, { name })
  code = code.replace(/\.catchall\(z\.never\(\)\)/g, '.strict()')
  return code
}

export const stringifySingleLine = (x: object): string => {
  return JSON.stringify(x, null, 1).replace(/\n */g, ' ')
}
