import * as sdk from '@botpress/sdk'
import { JSONSchema7 } from 'json-schema'
import _ from 'lodash'
import * as prettier from 'prettier'
import * as utils from '../utils'
import * as consts from './consts'

export type Primitive = string | number | boolean | null | undefined

export const zuiSchemaToTypeScriptType = async (zuiSchema: sdk.z.Schema, name: string): Promise<string> => {
  let code = zuiSchema.toTypescriptType()
  code = `export type ${name} = ${code}`
  code = await prettier.format(code, { parser: 'typescript' })
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
  const zuiSchema = sdk.transforms.fromJSONSchemaLegacy(schema)

  const allProps = {
    ...extraProps,
    schema: zuiSchema.toTypescriptSchema(),
  }

  let code = [
    consts.GENERATED_HEADER,
    'import { z } from "@botpress/sdk"',
    `export const ${name} = ${typescriptValuesToRecordString(allProps)}`,
  ].join('\n')
  code = await prettier.format(code, { parser: 'typescript' })
  return code
}

export const stringifySingleLine = (x: object): string => {
  return JSON.stringify(x, null, 1).replace(/\n */g, ' ')
}

export function primitiveToTypescriptValue(x: Primitive): string {
  if (typeof x === 'undefined') {
    return 'undefined'
  }
  return JSON.stringify(x)
}

export function primitiveRecordToTypescriptValues(x: Record<string, Primitive>): Record<string, string> {
  return _(x)
    .toPairs()
    .filter(([_key, value]) => value !== undefined)
    .map(([key, value]) => [key, primitiveToTypescriptValue(value)])
    .fromPairs()
    .value()
}

export const primitiveRecordToRecordString = (record: Record<string, Primitive>): string =>
  typescriptValuesToRecordString(primitiveRecordToTypescriptValues(record))

export const typescriptValuesToRecordString = (record: Record<string, string>): string =>
  ['{', ...Object.entries(record).map(([key, value]) => `  ${key}: ${value},`), '}'].join('\n')
