import { describe, expect, test, it } from 'vitest'
import { ZodTypeAny, z } from '../../z/index'
import { zuiKey } from '../../ui/constants'
import { jsonSchemaToZodStr, fromJSONSchemaLegacy, traverseZodDefinitions } from '.'
import { toJSONSchemaLegacy } from '../zui-to-json-schema-legacy/zui-extension'
import { JSONSchema7 } from 'json-schema'

const testZuiConversion = (zuiObject: ZodTypeAny) => {
  const jsonSchema = toJSONSchemaLegacy(zuiObject)
  const asZui = fromJSONSchemaLegacy(jsonSchema)
  const convertedJsonSchema = toJSONSchemaLegacy(asZui)

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
    const inner = [z.string().title('Name'), z.number().title('Age')] as const

    expect(toJSONSchemaLegacy(z.record(inner[0], inner[1]))).toMatchObject({
      type: 'object',
      additionalProperties: {
        type: 'number',
        [zuiKey]: {
          title: 'Age',
        },
      },
    })
  })

  test('convert discriminated union', () => {
    const zuiObject = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('a'),
        a: z.string(),
      }),
      z.object({
        type: z.literal('b'),
        b: z.number(),
      }),
    ])
    testZuiConversion(zuiObject)
  })

  test('convert union', () => {
    const zuiObject = z.union([
      z.object({
        type: z.literal('a'),
        a: z.string(),
      }),
      z.object({
        type: z.literal('b'),
        b: z.number(),
      }),
    ])
    testZuiConversion(zuiObject)
  })

  test('convert string with regex', () => {
    const zuiObject = z.string().regex(/hello/i).title('Title').length(20)
    testZuiConversion(zuiObject)
  })

  test('convert complex enum record', () => {
    const complexEnumRecord = z
      .object({
        status: z.enum(['Active', 'Inactive', 'Pending']),
        data: z.record(z.string(), z.union([z.number(), z.boolean()])),
      })
      .describe('Complex enum and record types')
    testZuiConversion(complexEnumRecord)
  })

  test('convert complex enum record', () => {
    const zuiSchema = z.discriminatedUnion('kek', [
      z.object({ kek: z.literal('A'), lel: z.boolean() }),
      z.object({ kek: z.literal('B'), lel: z.number() }),
    ])
    const strategy = { discriminator: true, unionStrategy: 'oneOf' } as const

    const jsonSchema = toJSONSchemaLegacy(zuiSchema, strategy)
    const converted = toJSONSchemaLegacy(fromJSONSchemaLegacy(jsonSchema), strategy)

    expect(jsonSchema).toEqual(converted)
  })

  test('convert object with nested', () => {
    const zuiSchema = fromJSONSchemaLegacy({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of person', [zuiKey]: { title: 'title' } },
        isAdmin: { type: 'boolean', [zuiKey]: { displayAs: ['Checkbox', {}] } },
        department: { type: 'string', default: 'IT', [zuiKey]: {} },
        address: {
          type: 'object',
          properties: {
            city: {
              type: 'object',
              properties: {
                name: { type: 'string', [zuiKey]: { title: 'City Name' } },
                bestFoods: {
                  type: 'array',
                  items: { type: 'string', [zuiKey]: { title: 'Food Name' } },
                  [zuiKey]: { title: 'Best foods' },
                },
              },
              additionalProperties: false,
              [zuiKey]: {},
            },
            street: { type: 'string', [zuiKey]: { title: 'Street name' } },
          },
          required: ['city'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
      required: ['address'],
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
      [zuiKey]: {},
    } as any)

    traverseZodDefinitions(zuiSchema._def, (type, def, path) => {
      if (path.join('.') === 'address.city.bestFoods') {
        expect(['ZodArray', 'ZodOptional']).toContain(type)
        if (type === 'ZodOptional') {
          expect(def[zuiKey]?.title).toBe('Best foods')
        }
      }
      if (path.join('.') === 'address.city.bestFoods.0.type') {
        expect(type).toBe('ZodString')
        expect(def?.[zuiKey]?.title).toBe('Food Name')
      }
    })
  })
})

describe('Coercion deserialization', () => {
  it('should deserialize coerced strings correctly', () => {
    const schema = toJSONSchemaLegacy(z.coerce.string())
    const asZui = fromJSONSchemaLegacy(schema)
    expect(asZui._def[zuiKey]?.coerce).toStrictEqual(true)
  })

  it('should deserialize coerced numbers correctly', () => {
    const schema = toJSONSchemaLegacy(z.coerce.number())
    const asZui = fromJSONSchemaLegacy(schema)
    expect(asZui._def[zuiKey]?.coerce).toStrictEqual(true)
  })

  it('should deserialize coerced booleans correctly', () => {
    const schema = toJSONSchemaLegacy(z.coerce.boolean())
    const asZui = fromJSONSchemaLegacy(schema)
    expect(asZui._def[zuiKey]?.coerce).toStrictEqual(true)
  })

  it('should deserialize coerced dates correctly', () => {
    const schema = toJSONSchemaLegacy(z.coerce.date())
    const asZui = fromJSONSchemaLegacy(schema)
    expect(asZui._def[zuiKey]?.coerce).toStrictEqual(true)
  })

  it('should deserialize coerced bigints correctly', () => {
    const schema = toJSONSchemaLegacy(z.coerce.bigint())
    const asZui = fromJSONSchemaLegacy(schema)
    expect(asZui._def[zuiKey]?.coerce).toStrictEqual(true)
  })

  it('should convert unresolved refs to zod refs', async () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        foo: { $ref: '#Foo' },
      },
      required: ['foo'],
    }
    const zStr = jsonSchemaToZodStr(schema)
    await expect(zStr).toMatchWithoutFormatting(`
      z.object({ foo: z.ref("#Foo") })
    `)
  })

  // TODO: decide if we want to support dereferencing; if not, remove this test, otherwise fix it
  it.skip('should resolve local refs', async () => {
    const schema: JSONSchema7 = {
      $defs: {
        Foo: {
          type: 'string',
          enum: ['foo'],
        },
        Bar: {
          type: 'string',
          enum: ['bar'],
        },
      },
      type: 'object',
      properties: {
        foo: { $ref: '#/$defs/Foo' },
        bar: { $ref: '#/$defs/Bar' },
      },
      required: ['foo', 'bar'],
    }
    const zStr = jsonSchemaToZodStr(schema)
    await expect(zStr).toMatchWithoutFormatting(`
      z.object({ foo: z.literal("foo"), bar: z.literal("bar") })
    `)
  })
})
