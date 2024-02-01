import { describe, expect, test } from 'vitest'
import { ZuiTypeAny, zui, zuiKey } from './zui'
import { getZuiSchemas } from './zui-schemas'
import { jsonSchemaToZui } from './json-schema-to-zui'
import { zuiToJsonSchema } from './zui-to-json-schema'

const testZuiConversion = (zuiObject: ZuiTypeAny) => {
  const jsonSchema = getZuiSchemas(zuiObject).schema
  const asZui = jsonSchemaToZui(jsonSchema)
  const convertedJsonSchema = zuiToJsonSchema(asZui)

  expect(jsonSchema).toEqual(convertedJsonSchema)

  const checkZuiProps = (obj: any) => {
    if (obj && typeof obj === 'object') {
      if (obj[zuiKey]) {
        expect(obj[zuiKey]).toBeDefined()
      }
      Object.values(obj).forEach(checkZuiProps)
    }
  }

  checkZuiProps(convertedJsonSchema)

  return convertedJsonSchema
}

describe('jsonSchemaToZui', () => {
  test('convert record', () => {
    const zuiObject = zui.record(zui.string().title('Name'), zui.number().title('Age'))
    testZuiConversion(zuiObject)
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
    testZuiConversion(zuiObject)
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
    testZuiConversion(zuiObject)
  })

  test('convert string with regex', () => {
    const zuiObject = zui.string().regex(/hello/i).title('Title').readonly(true).length(20)
    testZuiConversion(zuiObject)
  })

  test('convert complex enum record', () => {
    const complexEnumRecord = zui
      .object({
        status: zui.enum(['Active', 'Inactive', 'Pending']),
        data: zui.record(zui.string(), zui.union([zui.number(), zui.boolean()])),
      })
      .describe('Complex enum and record types')
    testZuiConversion(complexEnumRecord)
  })

  test('convert complex enum record', () => {
    const zuiSchema = zui.discriminatedUnion('kek', [
      zui.object({ kek: zui.literal('A'), lel: zui.boolean() }),
      zui.object({ kek: zui.literal('B'), lel: zui.number() }),
    ])
    const strategy = { discriminator: true, unionStrategy: 'oneOf' } as const

    const jsonSchema = getZuiSchemas(zuiSchema, strategy).schema
    const converted = zuiToJsonSchema(jsonSchemaToZui(jsonSchema), strategy)

    expect(jsonSchema).toEqual(converted)
  })

  test('convert object with nested', () => {
    const zuiSchema = zui.object({
      name: zui.string().describe('Name of person').title('title').optional(),
      isAdmin: zui.boolean().displayAs('Checkbox', {}).optional(),
      department: zui.string().default('IT').optional(),
      address: zui.object({
        city: zui.object({
          name: zui.string().title('City Name').optional(),
          synonyms: zui.array(zui.string().title('One synonyms')).title('All synonyms').optional(),
        }),
        street: zui.string().title('Street name').optional(),
      }),
    })

    const converted = testZuiConversion(zuiSchema) as any

    expect(converted.properties?.name[zuiKey]).toHaveProperty('title')
    expect(converted.properties?.isAdmin[zuiKey]).toHaveProperty('displayAs')
    expect(converted.properties?.address.properties.street[zuiKey]).toHaveProperty('title')
    expect(converted.properties?.address.properties.city.properties.name[zuiKey]).toHaveProperty('title')
    expect(converted.properties.address.properties.city.properties.synonyms[zuiKey]).toHaveProperty('title')
  })
})
