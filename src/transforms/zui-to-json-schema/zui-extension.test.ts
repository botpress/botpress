import { describe, test, expect } from 'vitest'
import { zuiToJsonSchema } from './zui-extension'
import { z } from '../../z'
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
        "$schema": "http://json-schema.org/draft-07/schema#",
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
        "${zuiKey}": {},
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
      $schema: 'http://json-schema.org/draft-07/schema#',
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
      testExample: z.string().displayAs<typeof testComponentDefinitions>('customstringcomponent', {
        multiline: true,
      }),
    })

    const jsonSchema = zuiToJsonSchema(schema)
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "additionalProperties": false,
        "properties": {
          "testExample": {
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
        "${zuiKey}": {},
      }
    `)
  })

  test('examples are available on json schema', () => {
    const schema = z.string()

    const jsonSchema = zuiToJsonSchema(schema, { stripZuiProps: true, $schemaUrl: false })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "type": "string",
      }
    `)
  })

  test('record with a value works', () => {
    const schema = z.record(z.string().max(30)).describe('hello')

    const jsonSchema = zuiToJsonSchema(schema, { stripZuiProps: true, $schemaUrl: false })
    expect(jsonSchema).toEqual({
      additionalProperties: {
        maxLength: 30,
        type: 'string',
      },
      description: 'hello',
      type: 'object',
    })
  })

  test('record with second parameter', () => {
    const schema = z.record(z.string(), z.number().max(30), {}).describe('hello')

    const jsonSchema = zuiToJsonSchema(schema, { stripZuiProps: true, $schemaUrl: false })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": {
          "maximum": 30,
          "type": "number",
        },
        "description": "hello",
        "type": "object",
      }
    `)
  })

  test('record with second parameter', () => {
    const schema = z.object({})

    const jsonSchema = zuiToJsonSchema(schema, { stripZuiProps: true, $schemaUrl: 'http://schema.com' })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "http://schema.com",
        "additionalProperties": false,
        "properties": {},
        "type": "object",
      }
    `)
  })

  test('record with second parameter', () => {
    const schema = z.object({ multipleTypes: z.union([z.string(), z.number()]) })

    const jsonSchema = zuiToJsonSchema(schema, { stripZuiProps: true, $schemaUrl: false })
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "multipleTypes": {
            "type": [
              "string",
              "number",
            ],
          },
        },
        "required": [
          "multipleTypes",
        ],
        "type": "object",
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

    const jsonSchema = zuiToJsonSchema(arrayWithObjects)
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "description": "Array of objects with validation",
        "items": {
          "additionalProperties": false,
          "properties": {
            "id": {
              "type": "number",
            },
            "title": {
              "minLength": 5,
              "type": "string",
            },
          },
          "required": [
            "id",
            "title",
          ],
          "type": "object",
        },
        "minItems": 1,
        "type": "array",
        "${zuiKey}": {},
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
        "$schema": "http://json-schema.org/draft-07/schema#",
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "kek": {
                "const": "A",
                "type": "string",
              },
              "lel": {
                "type": "boolean",
              },
            },
            "required": [
              "kek",
              "lel",
            ],
            "type": "object",
          },
          {
            "additionalProperties": false,
            "properties": {
              "kek": {
                "const": "B",
                "type": "string",
              },
              "lel": {
                "type": "number",
              },
            },
            "required": [
              "kek",
              "lel",
            ],
            "type": "object",
          },
        ],
        "${zuiKey}": {},
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
              },
              "lel": {
                "type": "boolean",
              },
            },
            "required": [
              "kek",
              "lel",
            ],
            "type": "object",
          },
          {
            "additionalProperties": false,
            "properties": {
              "kek": {
                "enum": [
                  "B",
                ],
                "type": "string",
              },
              "lel": {
                "type": "number",
              },
            },
            "required": [
              "kek",
              "lel",
            ],
            "type": "object",
          },
        ],
        "${zuiKey}": {},
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
      "$schema": "http://json-schema.org/draft-07/schema#",
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
})
