import { describe, expect, test } from 'vitest'
import { ZuiTypeAny, zui } from './zui'
import { getZuiSchemas } from './zui-schemas'
import { jsonSchemaToZod } from './json-schema-to-zod'
import zodToJsonSchema from '@bpinternal/zod-to-json-schema'
import { JsonSchema7 } from '.'

const testZodConversion = (zuiObject: ZuiTypeAny) => {
  // convert the zui schema to a simple json schema
  const { schema } = getZuiSchemas(zuiObject, { stripZuiProps: true })

  // conversion to zod and then back to json to ensure no data has been lost
  const converted = zodToJsonSchema(jsonSchemaToZod(schema))
  let t: JsonSchema7
  expect(schema).toEqual(converted)
}

describe('jsonSchemaToZod', () => {
  test('convert record', () => {
    const zuiObject = zui.record(zui.string().title('Name'), zui.number().title('Age'))
    testZodConversion(zuiObject)
  })

  test('convert discriminated union', () => {
    const zuiObject = zui.discriminatedUnion('type', [
      zui.object({
        type: zui.literal('a'),
        a: zui.string(),
      }),
      zui.object({
        type: zui.literal('b'),
        b: zui.number(),
      }),
    ])
    testZodConversion(zuiObject)
  })

  test('convert union', () => {
    const zuiObject = zui.union([
      zui.object({
        type: zui.literal('a'),
        a: zui.string(),
      }),
      zui.object({
        type: zui.literal('b'),
        b: zui.number(),
      }),
    ])
    testZodConversion(zuiObject)
  })

  test('convert string with regex', () => {
    const zuiObject = zui.string().regex(/hello/i).title('Title').readonly(true).length(20)
    testZodConversion(zuiObject)
  })

  test('convert complex enum record', () => {
    const complexEnumRecord = zui
      .object({
        status: zui.enum(['Active', 'Inactive', 'Pending']),
        data: zui.record(zui.string(), zui.union([zui.number(), zui.boolean()])),
      })
      .describe('Complex enum and record types')
    testZodConversion(complexEnumRecord)
  })

  test('convert complex enum record', () => {
    const zuiSchema = zui.discriminatedUnion('kek', [
      zui.object({ kek: zui.literal('A'), lel: zui.boolean() }),
      zui.object({ kek: zui.literal('B'), lel: zui.number() }),
    ])
    const strategy = { discriminator: true, unionStrategy: 'oneOf' } as const

    const jsonSchema = getZuiSchemas(zuiSchema, { stripZuiProps: true, ...strategy }).schema
    const converted = zodToJsonSchema(jsonSchemaToZod(jsonSchema), strategy)

    expect(jsonSchema).toEqual(converted)
  })
})
