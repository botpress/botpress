import { describe, test, expect, it } from 'vitest'
import { toJSONSchemaLegacy } from './zui-extension'
import { z } from '../../z/index'
import { zuiKey } from '../../ui/constants'

describe('zuiToJsonSchema', () => {
  test('should work', () => {
    const schema = z.object({
      name: z.string().title('Name').default('No Name'),
      age: z.number().max(100).min(0).title('Age').describe('Age in years').default(20),
    })

    const jsonSchema = toJSONSchemaLegacy(schema)

    expect(jsonSchema).toEqual({
      additionalProperties: false,
      properties: {
        age: {
          default: 20,
          description: 'Age in years',
          maximum: 100,
          minimum: 0,
          type: 'number',
          [zuiKey]: {
            title: 'Age',
          },
        },
        name: {
          default: 'No Name',
          type: 'string',
          [zuiKey]: {
            title: 'Name',
          },
        },
      },
      type: 'object',
      [zuiKey]: {},
    })
  })

  test('enums', () => {
    expect(
      toJSONSchemaLegacy(
        z.object({
          fruit: z.enum(['Apple', 'Banana', 'Orange']),
        }),
      ),
    ).toEqual({
      additionalProperties: false,
      properties: {
        fruit: {
          enum: ['Apple', 'Banana', 'Orange'],
          type: 'string',
          [zuiKey]: {},
        },
      },
      required: ['fruit'],
      type: 'object',
      [zuiKey]: {},
    })
  })

  test('supported properties are available in the json schema', () => {
    const schema = z.object({
      testExample: z
        .string()
        .nullable()
        .displayAs({ id: 'customstringcomponent', params: { multiline: true } }),
    })

    const jsonSchema = toJSONSchemaLegacy(schema)
    expect(jsonSchema).toEqual({
      additionalProperties: false,
      properties: {
        testExample: {
          nullable: true,
          type: 'string',
          [zuiKey]: {
            displayAs: [
              'customstringcomponent',
              {
                multiline: true,
              },
            ],
          },
        },
      },
      required: ['testExample'],
      type: 'object',
      [zuiKey]: {},
    })
  })

  test('examples are available on json schema', () => {
    const schema = z.string()

    const jsonSchema = toJSONSchemaLegacy(schema, { $schemaUrl: false })
    expect(jsonSchema).toEqual({
      type: 'string',
      [zuiKey]: {},
    })
  })

  test('record with a value works', () => {
    const schema = z.record(z.string().max(30)).describe('hello')

    const jsonSchema = toJSONSchemaLegacy(schema, { $schemaUrl: false })
    expect(jsonSchema).toEqual({
      additionalProperties: {
        maxLength: 30,
        type: 'string',
        [zuiKey]: {},
      },
      description: 'hello',
      type: 'object',
      [zuiKey]: {},
    })
  })

  test('record with second parameter', () => {
    const schema = z.record(z.string(), z.number().max(30), {}).describe('hello')

    const jsonSchema = toJSONSchemaLegacy(schema, { $schemaUrl: false })
    expect(jsonSchema).toEqual({
      additionalProperties: {
        maximum: 30,
        type: 'number',
        [zuiKey]: {},
      },
      description: 'hello',
      type: 'object',
      [zuiKey]: {},
    })
  })

  test('record with second parameter', () => {
    const schema = z.object({})

    const jsonSchema = toJSONSchemaLegacy(schema, { $schemaUrl: 'http://schema.com' })
    expect(jsonSchema).toEqual({
      $schema: 'http://schema.com',
      additionalProperties: false,
      properties: {},
      type: 'object',
      [zuiKey]: {},
    })
  })

  test('record with second parameter', () => {
    const schema = z.object({ multipleTypes: z.union([z.string(), z.number()]) })

    const jsonSchema = toJSONSchemaLegacy(schema, { $schemaUrl: false })
    expect(jsonSchema).toEqual({
      additionalProperties: false,
      properties: {
        multipleTypes: {
          type: ['string', 'number'],
          [zuiKey]: {},
        },
      },
      required: ['multipleTypes'],
      type: 'object',
      [zuiKey]: {},
    })
  })

  test('validate array of objects', async () => {
    const arrayWithObjects = z
      .array(
        z.object({
          id: z.number(),
          title: z.string().min(5),
        }),
      )
      .min(1)
      .describe('Array of objects with validation')

    const jsonSchema = toJSONSchemaLegacy(arrayWithObjects, { target: 'openApi3' })
    expect(jsonSchema).toEqual({
      description: 'Array of objects with validation',
      items: {
        additionalProperties: false,
        properties: {
          id: {
            type: 'number',
            [zuiKey]: {},
          },
          title: {
            minLength: 5,
            type: 'string',
            [zuiKey]: {},
          },
        },
        required: ['id', 'title'],
        type: 'object',
        [zuiKey]: {},
      },
      minItems: 1,
      type: 'array',
      [zuiKey]: {},
    })
  })

  test('oneOf', () => {
    const schema = z.discriminatedUnion('kek', [
      z.object({ kek: z.literal('A'), lel: z.boolean() }),
      z.object({ kek: z.literal('B'), lel: z.number() }),
    ])

    const jsonSchema = toJSONSchemaLegacy(schema)
    expect(jsonSchema).toEqual({
      anyOf: [
        {
          additionalProperties: false,
          properties: {
            kek: {
              enum: ['A'],
              type: 'string',
              [zuiKey]: {},
            },
            lel: {
              type: 'boolean',
              [zuiKey]: {},
            },
          },
          required: ['kek', 'lel'],
          type: 'object',
          [zuiKey]: {},
        },
        {
          additionalProperties: false,
          properties: {
            kek: {
              enum: ['B'],
              type: 'string',
              [zuiKey]: {},
            },
            lel: {
              type: 'number',
              [zuiKey]: {},
            },
          },
          required: ['kek', 'lel'],
          type: 'object',
          [zuiKey]: {},
        },
      ],
      [zuiKey]: {},
    })
  })

  test('oneOf with discriminator', () => {
    const schema = z.discriminatedUnion('kek', [
      z.object({ kek: z.literal('A'), lel: z.boolean() }),
      z.object({ kek: z.literal('B'), lel: z.number() }),
    ])

    const jsonSchema = toJSONSchemaLegacy(schema, { target: 'openApi3', discriminator: true, unionStrategy: 'oneOf' })
    expect(jsonSchema).toEqual({
      discriminator: {
        propertyName: 'kek',
      },
      oneOf: [
        {
          additionalProperties: false,
          properties: {
            kek: {
              enum: ['A'],
              type: 'string',
              [zuiKey]: {},
            },
            lel: {
              type: 'boolean',
              [zuiKey]: {},
            },
          },
          required: ['kek', 'lel'],
          type: 'object',
          [zuiKey]: {},
        },
        {
          additionalProperties: false,
          properties: {
            kek: {
              enum: ['B'],
              type: 'string',
              [zuiKey]: {},
            },
            lel: {
              type: 'number',
              [zuiKey]: {},
            },
          },
          required: ['kek', 'lel'],
          type: 'object',
          [zuiKey]: {},
        },
      ],
      [zuiKey]: {},
    })
  })

  test('lazy schemas', () => {
    const schema = z.lazy(() =>
      z.object({
        type: z.string().title('Type'),
        value: z.number().hidden(),
      }),
    )

    const zSchema = toJSONSchemaLegacy(schema)
    expect(zSchema).toEqual({
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          [zuiKey]: {
            title: 'Type',
          },
        },
        value: {
          type: 'number',
          [zuiKey]: {
            hidden: true,
          },
        },
      },
      required: ['type', 'value'],
      type: 'object',
      [zuiKey]: {},
    })
  })

  test('array of array', () => {
    const schema = z.array(z.array(z.string().disabled()))

    const jsonSchema = toJSONSchemaLegacy(schema)
    expect(jsonSchema).toEqual({
      items: {
        items: {
          type: 'string',
          [zuiKey]: {
            disabled: true,
          },
        },
        type: 'array',
        [zuiKey]: {},
      },
      type: 'array',
      [zuiKey]: {},
    })
  })

  test('generic is transformed to a ref', () => {
    const T = z.ref('T').disabled()
    const TJsonSchema = toJSONSchemaLegacy(T)
    expect(TJsonSchema).toEqual({
      $ref: 'T',
      [zuiKey]: {
        disabled: true,
      },
    })

    const schema = z.object({
      description: z.string(),
      data: T,
    })

    const jsonSchema = toJSONSchemaLegacy(schema)
    expect(jsonSchema).toEqual({
      additionalProperties: false,
      properties: {
        data: {
          $ref: 'T',
          [zuiKey]: {
            disabled: true,
          },
        },
        description: {
          type: 'string',
          [zuiKey]: {},
        },
      },
      required: ['description', 'data'],
      type: 'object',
      [zuiKey]: {},
    })
  })
})

describe('coercion serialization', () => {
  {
    it('serializes coerced dates correctly', () => {
      const schema = z.coerce.date().displayAs({ id: 'doood', params: {} } as never)
      const serialized = toJSONSchemaLegacy(schema)
      expect(serialized).toEqual({
        format: 'date-time',
        type: 'string',
        [zuiKey]: {
          coerce: true,
          displayAs: ['doood', {}],
        },
      })
    })

    it('serializes coerced strings correctly', () => {
      const schema = z.coerce.string()
      const serialized = toJSONSchemaLegacy(schema)
      expect(serialized).toEqual({
        type: 'string',
        [zuiKey]: {
          coerce: true,
        },
      })
    })

    it('serializes coerced bigints correctly', () => {
      const schema = z.coerce.bigint()
      const serialized = toJSONSchemaLegacy(schema)
      expect(serialized).toEqual({
        format: 'int64',
        type: 'integer',
        [zuiKey]: {
          coerce: true,
        },
      })
    })

    it('serializes coerced booleans correctly', () => {
      const schema = z.coerce.boolean()
      const serialized = toJSONSchemaLegacy(schema)
      expect(serialized).toEqual({
        type: 'boolean',
        [zuiKey]: {
          coerce: true,
        },
      })
    })

    it('serializes coerced numbers correctly', () => {
      const schema = z.coerce.number()
      const serialized = toJSONSchemaLegacy(schema)
      expect(serialized).toEqual({
        type: 'number',
        [zuiKey]: {
          coerce: true,
        },
      })
    })
  }
})
