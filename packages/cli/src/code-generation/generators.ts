import * as sdk from '@botpress/sdk'
import { JSONSchema7 } from 'json-schema'
import * as prettier from 'prettier'
import * as utils from '../utils'
import * as consts from './consts'

export const zuiSchemaToTypeScriptType = async (zuiSchema: sdk.z.Schema, name: string): Promise<string> => {
  let code = zuiSchema.toTypescript()
  code = `export type ${name} = ${code}`
  code = prettier.format(code, { parser: 'typescript' })
  return [
    //
    consts.GENERATED_HEADER,
    code,
  ].join('\n')
}

export const jsonSchemaToTypescriptZuiSchema = async (
  schema: JSONSchema7,
  name: string,
  extraProps: Record<string, string> = {}
): Promise<string> => {
  schema = await utils.schema.dereferenceSchema(schema)
  const zuiSchema = sdk.z.fromJsonSchema(schema)
  let code = [
    consts.GENERATED_HEADER,
    'import { z } from "@botpress/sdk"',
    `export const ${name} = {`,
    ...Object.entries(extraProps).map(([key, value]) => `  ${key}: ${value},`),
    `  schema: ${zuiSchema.toTypescriptSchema()}`,
    '}',
  ].join('\n')
  code = prettier.format(code, { parser: 'typescript' })
  return code
}

export const stringifySingleLine = (x: object): string => {
  return JSON.stringify(x, null, 1).replace(/\n */g, ' ')
}

export function primitiveToTypescriptValue(x: string | number | boolean | null | undefined): string {
  if (typeof x === 'undefined') {
    return 'undefined'
  }
  return JSON.stringify(x)
}
