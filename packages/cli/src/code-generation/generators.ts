import { AnyZodObject } from '@botpress/sdk'
import { compile } from 'json-schema-to-typescript'
import * as prettier from 'prettier'
import * as utils from '../utils'

export type GeneratorType = 'zui' | 'jsonSchemaToTypescript'

export const zuiSchemaToTypeScriptType = async (
  zuiSchema: AnyZodObject,
  name: string,
  type: GeneratorType = 'jsonSchemaToTypescript'
): Promise<string> => {
  if (type === 'zui') {
    let code = zuiSchema.toTypescript()
    code = `export type ${name} = ${code}`
    code = await prettier.format(code, { parser: 'typescript' })
    return code
  }
  const jsonSchema = utils.schema.mapZodToJsonSchema({ schema: zuiSchema })
  const code = await compile(jsonSchema, name, { unknownAny: false })
  return code
}

export const stringifySingleLine = (x: object): string => {
  return JSON.stringify(x, null, 1).replace(/\n */g, ' ')
}
