import * as sdk from '@botpress/sdk'
import { JSONSchema7 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'
import * as prettier from 'prettier'
import * as utils from '../utils'
import * as consts from './consts'

export type GeneratorType = 'zui' | 'jsonSchemaToTypescript'

export const zuiSchemaToTypeScriptType = async (
  zuiSchema: sdk.z.AnyZodObject,
  name: string,
  type: GeneratorType = 'jsonSchemaToTypescript'
): Promise<string> => {
  if (type === 'zui') {
    let code = zuiSchema.toTypescript()
    code = `export type ${name} = ${code}`
    code = prettier.format(code, { parser: 'typescript' })
    return [
      //
      consts.GENERATED_HEADER,
      code,
    ].join('\n')
  }
  const jsonSchema = await utils.schema.mapZodToJsonSchema({ schema: zuiSchema })
  const code = await compile(jsonSchema, name, { unknownAny: false })
  return code
}

export const jsonSchemaToTypescriptZuiSchema = async (schema: JSONSchema7, name: string): Promise<string> => {
  schema = await utils.schema.dereferenceSchema(schema)
  const zuiSchema = sdk.z.fromJsonSchema(schema)
  let code = [
    consts.GENERATED_HEADER,
    'import { z } from "@botpress/sdk"',
    `export const ${name} = {
      schema: ${zuiSchema.toTypescriptSchema()}
    }`,
  ].join('\n')
  code = prettier.format(code, { parser: 'typescript' })
  return code
}

export const stringifySingleLine = (x: object): string => {
  return JSON.stringify(x, null, 1).replace(/\n */g, ' ')
}
