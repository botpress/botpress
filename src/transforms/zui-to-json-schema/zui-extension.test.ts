import { describe, test, expect } from 'vitest'
import { zuiToJsonSchema } from './zui-extension'
import { z } from '../../z/index'
import { zuiKey } from '../../ui/constants'
import { testComponentDefinitions } from '../../ui/ui.test'

describe('zuiToJsonSchema', () => {
  test('should work', () => {
    const schema = z.object({
      name: z.string().title('Name').default('No Name'),
      age: z.number().max(100).min(0).title('Age').describe('Age in years').default(20),
    })

    const jsonSchema = zuiToJsonSchema(schema)

    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "age": {
            "default": 20,
            "description": "Age in years",
            "maximum": 100,
            "minimum": 0,
            "type": "number",
            "${zuiKey}": {
              "title": "Age",
            },
          },
          "name": {
            "default": "No Name",
            "type": "string",
            "${zuiKey}": {
              "title": "Name",
            },
          },
        },
        "type": "object",
        "x-zui": {},
      }
    `)
  })

  test('enums', () => {
    expect(
      zuiToJsonSchema(
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
        .displayAs<typeof testComponentDefinitions>({ id: 'customstringcomponent', params: { multiline: true } }),
    })

    const jsonSchema = zuiToJsonSchema(schema)
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "testExample": {
            "nullable": true,
            "type": "string",
            "${zuiKey}": {
              "displayAs": [
                "customstringcomponent",
                {
                  "multiline": true,
                },
              ],
            },
          },
        },
        "required": [
          "testExample",
        ],
        "type": "object",
        "x-zui": {},
      }
    `)
  })

  test('examples are available on json schema', () => {
    const schema = z.string()

    const jsonSchema = zuiToJsonSchema(schema, { $schemaUrl: false })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "type": "string",
        "x-zui": {},
      }
    `)
  })

  test('record with a value works', () => {
    const schema = z.record(z.string().max(30)).describe('hello')

    const jsonSchema = zuiToJsonSchema(schema, { $schemaUrl: false })
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

    const jsonSchema = zuiToJsonSchema(schema, { $schemaUrl: false })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": {
          "maximum": 30,
          "type": "number",
          "x-zui": {},
        },
        "description": "hello",
        "type": "object",
        "x-zui": {},
      }
    `)
  })

  test('record with second parameter', () => {
    const schema = z.object({})

    const jsonSchema = zuiToJsonSchema(schema, { $schemaUrl: 'http://schema.com' })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "http://schema.com",
        "additionalProperties": false,
        "properties": {},
        "type": "object",
        "x-zui": {},
      }
    `)
  })

  test('record with second parameter', () => {
    const schema = z.object({ multipleTypes: z.union([z.string(), z.number()]) })

    const jsonSchema = zuiToJsonSchema(schema, { $schemaUrl: false })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "multipleTypes": {
            "type": [
              "string",
              "number",
            ],
            "x-zui": {},
          },
        },
        "required": [
          "multipleTypes",
        ],
        "type": "object",
        "x-zui": {},
      }
    `)
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

    const jsonSchema = zuiToJsonSchema(arrayWithObjects, { target: 'openApi3' })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "description": "Array of objects with validation",
        "items": {
          "additionalProperties": false,
          "properties": {
            "id": {
              "type": "number",
              "x-zui": {},
            },
            "title": {
              "minLength": 5,
              "type": "string",
              "x-zui": {},
            },
          },
          "required": [
            "id",
            "title",
          ],
          "type": "object",
          "x-zui": {},
        },
        "minItems": 1,
        "type": "array",
        "x-zui": {},
      }
    `)
  })

  test('oneOf', () => {
    const schema = z.discriminatedUnion('kek', [
      z.object({ kek: z.literal('A'), lel: z.boolean() }),
      z.object({ kek: z.literal('B'), lel: z.number() }),
    ])

    const jsonSchema = zuiToJsonSchema(schema)
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "kek": {
                "enum": [
                  "A",
                ],
                "type": "string",
                "x-zui": {},
              },
              "lel": {
                "type": "boolean",
                "x-zui": {},
              },
            },
            "required": [
              "kek",
              "lel",
            ],
            "type": "object",
            "x-zui": {},
          },
          {
            "additionalProperties": false,
            "properties": {
              "kek": {
                "enum": [
                  "B",
                ],
                "type": "string",
                "x-zui": {},
              },
              "lel": {
                "type": "number",
                "x-zui": {},
              },
            },
            "required": [
              "kek",
              "lel",
            ],
            "type": "object",
            "x-zui": {},
          },
        ],
        "x-zui": {},
      }
    `)
  })

  test('oneOf with discriminator', () => {
    const schema = z.discriminatedUnion('kek', [
      z.object({ kek: z.literal('A'), lel: z.boolean() }),
      z.object({ kek: z.literal('B'), lel: z.number() }),
    ])

    const jsonSchema = zuiToJsonSchema(schema, { target: 'openApi3', discriminator: true, unionStrategy: 'oneOf' })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "discriminator": {
          "propertyName": "kek",
        },
        "oneOf": [
          {
            "additionalProperties": false,
            "properties": {
              "kek": {
                "enum": [
                  "A",
                ],
                "type": "string",
                "x-zui": {},
              },
              "lel": {
                "type": "boolean",
                "x-zui": {},
              },
            },
            "required": [
              "kek",
              "lel",
            ],
            "type": "object",
            "x-zui": {},
          },
          {
            "additionalProperties": false,
            "properties": {
              "kek": {
                "enum": [
                  "B",
                ],
                "type": "string",
                "x-zui": {},
              },
              "lel": {
                "type": "number",
                "x-zui": {},
              },
            },
            "required": [
              "kek",
              "lel",
            ],
            "type": "object",
            "x-zui": {},
          },
        ],
        "x-zui": {},
      }
    `)
  })

  test('lazy schemas', () => {
    const schema = z.lazy(() =>
      z.object({
        type: z.string().title('Type'),
        value: z.number().hidden(),
      }),
    )

    expect(schema.toJsonSchema()).toMatchInlineSnapshot(`
    {
      "additionalProperties": false,
      "properties": {
        "type": {
          "type": "string",
          "x-zui": {
            "title": "Type",
          },
        },
        "value": {
          "type": "number",
          "x-zui": {
            "hidden": true,
          },
        },
      },
      "required": [
        "type",
        "value",
      ],
      "type": "object",
      "x-zui": {},
    }
  `)
  })

  test('array of array', () => {
    const schema = z.array(z.array(z.string().disabled()))

    const jsonSchema = zuiToJsonSchema(schema)
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "items": {
          "items": {
            "type": "string",
            "${zuiKey}": {
              "disabled": true,
            },
          },
          "type": "array",
          "x-zui": {},
        },
        "type": "array",
        "x-zui": {},
      }
    `)
  })

  test('generic is transformed to a ref', () => {
    const T = z.ref('T').disabled()
    const TJsonSchema = zuiToJsonSchema(T)
    expect(TJsonSchema).toMatchInlineSnapshot(`
      {
        "$ref": "T",
        "${zuiKey}": {
          "disabled": true,
        },
      }
    `)

    const schema = z.object({
      description: z.string(),
      data: T,
    })

    const jsonSchema = zuiToJsonSchema(schema)
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "data": {
            "$ref": "T",
            "${zuiKey}": {
              "disabled": true,
            },
          },
          "description": {
            "type": "string",
            "x-zui": {},
          },
        },
        "required": [
          "description",
          "data",
        ],
        "type": "object",
        "x-zui": {},
      }
    `)
  })
})

describe('coercion serialization', () => {
  {
    it('serializes coerced dates correctly', () => {
      const schema = z.coerce.date().displayAs({ id: 'doood', params: {} } as never)
      const serialized = schema.toJsonSchema()
      expect(serialized).toMatchInlineSnapshot(`
      {
        "format": "date-time",
        "type": "string",
        "x-zui": {
          "coerce": true,
          "displayAs": [
            "doood",
            {},
          ],
        },
      }
    `)
    })

    it('serializes coerced strings correctly', () => {
      const schema = z.coerce.string()
      const serialized = schema.toJsonSchema()
      expect(serialized).toMatchInlineSnapshot(`
      {
        "type": "string",
        "x-zui": {
          "coerce": true,
        },
      }
    `)
    })

    it('serializes coerced bigints correctly', () => {
      const schema = z.coerce.bigint()
      const serialized = schema.toJsonSchema()
      expect(serialized).toMatchInlineSnapshot(`
      {
        "format": "int64",
        "type": "integer",
        "x-zui": {
          "coerce": true,
        },
      }
    `)
    })

    it('serializes coerced booleans correctly', () => {
      const schema = z.coerce.boolean()
      const serialized = schema.toJsonSchema()
      expect(serialized).toMatchInlineSnapshot(`
      {
        "type": "boolean",
        "x-zui": {
          "coerce": true,
        },
      }
    `)
    })

    it('serializes coerced numbers correctly', () => {
      const schema = z.coerce.number()
      const serialized = schema.toJsonSchema()
      expect(serialized).toMatchInlineSnapshot(`
      {
        "type": "number",
        "x-zui": {
          "coerce": true,
        },
      }
    `)
    })
  }
})
