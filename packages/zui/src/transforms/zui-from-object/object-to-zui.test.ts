import { describe, expect, test } from 'vitest'
import { fromObject } from '.'
import { toJSONSchemaLegacy } from '../zui-to-json-schema-legacy'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { fromJSONSchemaLegacy } from '../zui-from-json-schema-legacy'

function asSchema(s: JSONSchema7Definition | undefined): JSONSchema7 | undefined {
  if (s === undefined) {
    return undefined
  }
  return s as JSONSchema7
}

describe('object-to-zui', () => {
  test('validate object to json', async () => {
    const schema: JSONSchema7 = toJSONSchemaLegacy(
      fromObject({ name: 'Bob', age: 20, birthDate: '1988-11-29', isAdmin: true }, { optional: true }),
    )

    if (schema.type !== 'object') {
      throw new Error('Expected object type')
    }

    expect(schema).toHaveProperty('type', 'object')
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(4)

    for (const key in schema.properties) {
      expect(schema.properties[key]).toHaveProperty('type')
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

    const schema = toJSONSchemaLegacy(fromObject(obj, { optional: true }))
    fromJSONSchemaLegacy(schema).parse(obj)

    expect(schema).toEqual({
      additionalProperties: false,
      properties: {
        address: {
          additionalProperties: false,
          properties: {
            city: {
              type: 'string',
              'x-zui': {},
            },
            state: {
              type: 'string',
              'x-zui': {},
            },
            street: {
              type: 'string',
              'x-zui': {},
            },
          },
          type: 'object',
          'x-zui': {},
        },
        age: {
          type: 'number',
          'x-zui': {},
        },
        birthDate: {
          format: 'date-time',
          type: 'string',
          'x-zui': {},
        },
        isAdmin: {
          type: 'boolean',
          'x-zui': {},
        },
        name: {
          type: 'string',
          'x-zui': {},
        },
      },
      type: 'object',
      'x-zui': {},
    })
  })

  test('should handle null values correctly', () => {
    const schema: JSONSchema7 = toJSONSchemaLegacy(
      fromObject(
        {
          test: null,
          anotherValue: 'test',
        },
        { optional: true },
      ),
    )

    if (schema.type !== 'object') {
      throw new Error('Expected object type')
    }
    expect(asSchema(schema.properties?.test)?.type).toBeUndefined()
    expect(asSchema(schema.properties?.test)?.enum).toStrictEqual(['null'])
    expect(asSchema(schema.properties?.anotherValue)?.type).toBe('string')
  })

  test('should handle nested objects correctly', () => {
    const schema: JSONSchema7 = toJSONSchemaLegacy(
      fromObject(
        {
          user: {
            name: 'Alice',
            age: 30,
            address: {
              street: '123 Main St',
              city: 'New York',
            },
          },
        },
        { optional: true, nullable: true },
      ),
    )

    const useSchema = asSchema(schema.properties?.user)
    if (schema.type !== 'object' || useSchema?.type !== 'object') {
      throw new Error('Expected object type')
    }
    expect(useSchema?.type).toBe('object')
    expect(asSchema(useSchema?.properties?.name)?.type).toBe('string')
    expect(asSchema(useSchema?.properties?.age)?.type).toBe('number')
    expect(asSchema(useSchema?.properties?.address)?.type).toBe('object')
  })

  test('should handle arrays correctly', () => {
    const schema: JSONSchema7 = toJSONSchemaLegacy(
      fromObject(
        {
          tags: ['tag1', 'tag2'],
          scores: [1, 2, 3],
        },
        { optional: true },
      ),
    )

    const tagsSchema = asSchema(schema.properties?.tags)
    const scoresSchema = asSchema(schema.properties?.scores)
    if (tagsSchema?.type !== 'array' || scoresSchema?.type !== 'array') {
      throw new Error('Expected array type')
    }
    expect(Array.isArray(tagsSchema?.items)).toBe(false)
    expect(tagsSchema?.type).toBe('array')
    expect((tagsSchema?.items as any)?.type).toBe('string')
    expect(scoresSchema?.type).toBe('array')
    expect(Array.isArray(scoresSchema?.items)).toBe(false)
    expect((scoresSchema?.items as any)?.type).toBe('number')
  })

  test('should handle empty objects correctly', () => {
    const schema: JSONSchema7 = toJSONSchemaLegacy(fromObject({}))
    expect(schema).toHaveProperty('type', 'object')
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(0)
  })

  test('should handle datetime with timezone correctly', () => {
    const schema: JSONSchema7 = toJSONSchemaLegacy(
      fromObject({
        eventTime: '2023-03-15T14:00:00+01:00',
      }),
    )
    const eventTimeSchema = asSchema(schema.properties?.eventTime)

    if (eventTimeSchema?.type !== 'string') {
      throw new Error('Expected string type')
    }
    expect(eventTimeSchema?.format).toBe('date-time')
    expect(eventTimeSchema?.type).toBe('string')
  })

  test('empty objects are considered passtrough, other are strict', () => {
    const schema: JSONSchema7 = toJSONSchemaLegacy(
      fromObject({ input: {}, test: { output: {} }, fixed: { value: true } }),
    )

    const testSchema = asSchema(schema.properties?.test)
    const fixedSchema = asSchema(schema.properties?.fixed)

    if (testSchema?.type !== 'object' || fixedSchema?.type !== 'object') {
      throw new Error('Expected object type')
    }
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(3)
    expect(schema.properties?.input).toHaveProperty('additionalProperties', true)
    expect(testSchema).toHaveProperty('additionalProperties', false)
    expect(testSchema?.properties?.output).toHaveProperty('additionalProperties', true)
    expect(fixedSchema).toHaveProperty('additionalProperties', false)
  })

  test('when passtrough is set to true, they are all passtrough', () => {
    const schema: JSONSchema7 = toJSONSchemaLegacy(
      fromObject({ input: {}, test: { output: {} }, fixed: { value: true } }, { passtrough: true }),
    )

    const testSchema = asSchema(schema.properties?.test)
    const fixedSchema = asSchema(schema.properties?.fixed)

    if (testSchema?.type !== 'object' || fixedSchema?.type !== 'object') {
      throw new Error('Expected object type')
    }

    expect(schema.properties?.input).toHaveProperty('additionalProperties', true)
    expect(testSchema).toHaveProperty('additionalProperties', true)
    expect(testSchema?.properties?.output).toHaveProperty('additionalProperties', true)
    expect(fixedSchema).toHaveProperty('additionalProperties', true)
  })
})
