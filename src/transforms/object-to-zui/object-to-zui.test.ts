import { describe, expect, test } from 'vitest'
import { objectToZui } from '.'
import { z } from '../../z/index'
import { JSONSchemaOfType, ObjectSchema } from '../../ui/types'

describe('object-to-zui', () => {
  test('validate object to json', async () => {
    const schema = objectToZui(
      { name: 'Bob', age: 20, birthDate: '1988-11-29', isAdmin: true },
      { optional: true },
    ).toJsonSchema()

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

    const schema = z.fromObject(obj, { optional: true }).toJsonSchema()
    z.fromJsonSchema(schema).parse(obj)

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
    const schema = z
      .fromObject(
        {
          test: null,
          anotherValue: 'test',
        },
        { optional: true },
      )
      .toJsonSchema() as ObjectSchema

    if (schema.type !== 'object') {
      throw new Error('Expected object type')
    }
    expect(schema.properties?.test?.type).toBeUndefined()
    expect((schema.properties?.test as any).enum).toStrictEqual(['null'])
    expect(schema.properties?.anotherValue?.type).toBe('string')
  })

  test('should handle nested objects correctly', () => {
    const schema = z
      .fromObject(
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
      )
      .toJsonSchema({ target: 'openApi3' })

    if (schema.type !== 'object' || schema.properties?.user?.type !== 'object') {
      throw new Error('Expected object type')
    }
    expect(schema.properties?.user?.type).toBe('object')
    expect(schema.properties?.user?.properties?.name?.type).toBe('string')
    expect(schema.properties?.user?.properties?.age?.type).toBe('number')
    expect(schema.properties?.user?.properties?.address?.type).toBe('object')
  })

  test('should handle arrays correctly', () => {
    const schema = z
      .fromObject(
        {
          tags: ['tag1', 'tag2'],
          scores: [1, 2, 3],
        },
        { optional: true },
      )
      .toJsonSchema() as JSONSchemaOfType<'object'>

    if (schema.properties?.tags?.type !== 'array' || schema.properties?.scores?.type !== 'array') {
      throw new Error('Expected array type')
    }
    expect(Array.isArray(schema.properties?.tags?.items)).toBe(false)
    expect(schema.properties?.tags?.type).toBe('array')
    expect((schema.properties?.tags?.items as any)?.type).toBe('string')
    expect(schema.properties?.scores?.type).toBe('array')
    expect(Array.isArray(schema.properties?.scores?.items)).toBe(false)
    expect((schema.properties?.scores?.items as any)?.type).toBe('number')
  })

  test('should handle empty objects correctly', () => {
    const schema = z.fromObject({}).toJsonSchema() as JSONSchemaOfType<'object'>
    expect(schema).toHaveProperty('type', 'object')
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(0)
  })

  test('should handle datetime with timezone correctly', () => {
    const schema = z
      .fromObject({
        eventTime: '2023-03-15T14:00:00+01:00',
      })
      .toJsonSchema() as JSONSchemaOfType<'object'>

    if (schema.properties?.eventTime?.type !== 'string') {
      throw new Error('Expected string type')
    }
    expect(schema.properties?.eventTime?.format).toBe('date-time')
    expect(schema.properties?.eventTime?.type).toBe('string')
  })

  test('empty objects are considered passtrough, other are strict', () => {
    const schema = z
      .fromObject({ input: {}, test: { output: {} }, fixed: { value: true } })
      .toJsonSchema() as JSONSchemaOfType<'object'>
    if (schema.properties?.test?.type !== 'object' || schema.properties?.fixed?.type !== 'object') {
      throw new Error('Expected object type')
    }
    expect(schema).toHaveProperty('properties')
    expect(Object.keys(schema.properties || {})).toHaveLength(3)
    expect(schema.properties?.input).toHaveProperty('additionalProperties', true)
    expect(schema.properties?.test).toHaveProperty('additionalProperties', false)
    expect(schema.properties?.test?.properties?.output).toHaveProperty('additionalProperties', true)
    expect(schema.properties?.fixed).toHaveProperty('additionalProperties', false)
  })

  test('when passtrough is set to true, they are all passtrough', () => {
    const schema = z
      .fromObject({ input: {}, test: { output: {} }, fixed: { value: true } }, { passtrough: true })
      .toJsonSchema() as JSONSchemaOfType<'object'>

    if (schema.properties?.test?.type !== 'object' || schema.properties?.fixed?.type !== 'object') {
      throw new Error('Expected object type')
    }

    expect(schema.properties?.input).toHaveProperty('additionalProperties', true)
    expect(schema.properties?.test).toHaveProperty('additionalProperties', true)
    expect(schema.properties?.test?.properties?.output).toHaveProperty('additionalProperties', true)
    expect(schema.properties?.fixed).toHaveProperty('additionalProperties', true)
  })
})
