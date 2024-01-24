import { describe, test, expect } from 'vitest'
import { zui } from '.'
import { getZuiSchemas } from '.'
import { zuiKey } from './zui'
import { z } from 'zod'

describe('zuiToJsonSchema', () => {
  test('should work', () => {
    const schema = zui.object({
      name: zui.string().title('Name').default('No Name'),
      age: zui.number().max(100).min(0).title('Age').describe('Age in years').default(20),
    })

    const jsonSchema = getZuiSchemas(schema)

    expect(jsonSchema.schema).toMatchInlineSnapshot(`
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

    expect(jsonSchema.uischema).toMatchInlineSnapshot(`
      {
        "elements": [
          {
            "label": "Name",
            "scope": "#/properties/name",
          },
          {
            "label": "Age",
            "scope": "#/properties/age",
          },
        ],
        "type": "VerticalLayout",
      }
    `)
  })

  test('non-object schemas', () => {
    const expectEmptySchema = (input: any) => {
      expect(getZuiSchemas(input).uischema).toMatchInlineSnapshot(`{}`)
    }
    expectEmptySchema(zui.string().title('Name').default('No Name'))
    expectEmptySchema(zui.boolean())
    expectEmptySchema(zui.array(zui.string()))
    expectEmptySchema(zui.number().title('Age').default(20))
  })

  test('enums', () => {
    expect(
      getZuiSchemas(
        zui.object({
          fruit: zui.enum(['Apple', 'Banana', 'Orange']),
        }),
      ),
    ).toMatchInlineSnapshot(`
      {
        "schema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "additionalProperties": false,
          "properties": {
            "fruit": {
              "enum": [
                "Apple",
                "Banana",
                "Orange",
              ],
              "type": "string",
              "${zuiKey}": {},
            },
          },
          "required": [
            "fruit",
          ],
          "type": "object",
          "${zuiKey}": {},
        },
        "uischema": {
          "elements": [
            {
              "label": undefined,
              "scope": "#/properties/fruit",
            },
          ],
          "type": "VerticalLayout",
        },
      }
    `)
  })

  test('supported properties are avaialble in the json schema', () => {
    const schema = zui.object({
      testExample: zui.string().examples(['hello']),
    })

    const jsonSchema = getZuiSchemas(schema)
    expect(jsonSchema.schema).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "additionalProperties": false,
        "properties": {
          "testExample": {
            "examples": [
              "hello",
            ],
            "type": "string",
            "${zuiKey}": {
              "examples": [
                "hello",
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
    const schema = zui.string().examples(['Example 1'])

    const jsonSchema = getZuiSchemas(schema, { stripZuiProps: true, stripSchemaProps: true })
    expect(jsonSchema.schema).toMatchInlineSnapshot(`
      {
        "examples": [
          "Example 1",
        ],
        "type": "string",
      }
    `)
  })

  test('record with a value works', () => {
    const schema = zui.record(zui.string().max(30)).describe('hello')

    const jsonSchema = getZuiSchemas(schema, { stripZuiProps: true, stripSchemaProps: true })
    expect(jsonSchema.schema).toMatchInlineSnapshot(`
      {
        "additionalProperties": {
          "maxLength": 30,
          "type": "string",
        },
        "description": "hello",
        "type": "object",
      }
    `)
  })

  test('record with second parameter', () => {
    const schema = zui.record(zui.string(), zui.number().max(30), {}).describe('hello')

    const jsonSchema = getZuiSchemas(schema, { stripZuiProps: true, stripSchemaProps: true })
    expect(jsonSchema.schema).toMatchInlineSnapshot(`
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
    const schema = zui.object({ multipleTypes: z.union([z.string(), z.number()]) })

    const jsonSchema = getZuiSchemas(schema, { stripZuiProps: true, stripSchemaProps: true })
    expect(jsonSchema.schema).toMatchInlineSnapshot(`
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
    const arrayWithObjects = zui
      .array(
        zui.object({
          id: zui.number(),
          title: zui.string().min(5),
        }),
      )
      .min(1)
      .describe('Array of objects with validation')

    const jsonSchema = getZuiSchemas(arrayWithObjects)
    expect(jsonSchema.schema).toMatchInlineSnapshot(`
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
    const schema = zui.discriminatedUnion('kek', [
      zui.object({ kek: zui.literal('A'), lel: zui.boolean() }),
      zui.object({ kek: zui.literal('B'), lel: zui.number() }),
    ])

    const jsonSchema = getZuiSchemas(schema)
    expect(jsonSchema.schema).toMatchInlineSnapshot(`
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
    const schema = zui.discriminatedUnion('kek', [
      zui.object({ kek: zui.literal('A'), lel: zui.boolean() }),
      zui.object({ kek: zui.literal('B'), lel: zui.number() }),
    ])

    const jsonSchema = getZuiSchemas(schema, { target: 'openApi3', discriminator: true, unionStrategy: 'oneOf' })
    expect(jsonSchema.schema).toMatchInlineSnapshot(`
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
})
