import { describe, expect, test } from 'vitest'
import { objectToZui } from './object-to-zui'
import { zui } from './zui'

describe('object-to-zui', () => {
  test('validate object to json', async () => {
    const schema = objectToZui({ name: 'Bob', age: 20, birthDate: '1988-11-29', isAdmin: true }).toJsonSchema()

    expect(schema).toHaveProperty('type', 'object')
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(4)

    for (const key in schema.properties) {
      expect(schema.properties[key]).toHaveProperty('type')
      expect(schema.properties[key]).toHaveProperty('x-zui')
    }
  })

  test('validate object to json (actual json)', async () => {
    const obj = {
      name: 'Bob',
      age: 20,
      birthDate: '1988-11-29T00:00:00.000Z',
      isAdmin: true,
      address: { street: '123 Main St', city: 'New York', state: 'NY' },
    }

    const schema = zui.fromObject(obj).toJsonSchema()
    zui.fromJsonSchema(schema).parse(obj)

    expect(schema).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "additionalProperties": false,
        "properties": {
          "address": {
            "additionalProperties": false,
            "properties": {
              "city": {
                "type": "string",
              },
              "state": {
                "type": "string",
              },
              "street": {
                "type": "string",
              },
            },
            "type": "object",
            "x-zui": {},
          },
          "age": {
            "type": "number",
            "x-zui": {},
          },
          "birthDate": {
            "format": "date-time",
            "type": "string",
            "x-zui": {},
          },
          "isAdmin": {
            "type": "boolean",
            "x-zui": {},
          },
          "name": {
            "type": "string",
            "x-zui": {},
          },
        },
        "type": "object",
        "x-zui": {},
      }
    `)
  })

  test('should handle null values correctly', () => {
    const schema = zui
      .fromObject({
        test: null,
        anotherValue: 'test',
      })
      .toJsonSchema()
    expect(schema.properties?.test?.type).toBe('null')
    expect(schema.properties?.anotherValue?.type).toBe('string')
  })

  test('should handle nested objects correctly', () => {
    const schema = zui
      .fromObject({
        user: {
          name: 'Alice',
          age: 30,
          address: {
            street: '123 Main St',
            city: 'New York',
          },
        },
      })
      .toJsonSchema()
    expect(schema.properties?.user?.type).toBe('object')
    expect(schema.properties?.user?.properties?.name?.type).toBe('string')
    expect(schema.properties?.user?.properties?.age?.type).toBe('number')
    expect(schema.properties?.user?.properties?.address?.type).toBe('object')
  })

  test('should handle arrays correctly', () => {
    const schema = zui
      .fromObject({
        tags: ['tag1', 'tag2'],
        scores: [1, 2, 3],
      })
      .toJsonSchema()
    expect(schema.properties?.tags?.type).toBe('array')
    expect(schema.properties?.tags?.items?.type).toBe('string')
    expect(schema.properties?.scores?.type).toBe('array')
    expect(schema.properties?.scores?.items?.type).toBe('number')
  })

  test('should handle empty objects correctly', () => {
    const schema = zui.fromObject({}).toJsonSchema()
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(0)
  })

  test('should handle datetime with timezone correctly', () => {
    const schema = zui
      .fromObject({
        eventTime: '2023-03-15T14:00:00+01:00',
      })
      .toJsonSchema()

    expect(schema.properties?.eventTime?.format).toBe('date-time')
    expect(schema.properties?.eventTime?.type).toBe('string')
  })
})
