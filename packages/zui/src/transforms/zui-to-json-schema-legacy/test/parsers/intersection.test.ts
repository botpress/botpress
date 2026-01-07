import { describe, it, expect } from 'vitest'
import { zuiKey } from '../../../../ui/constants'
import { z } from '../../../../z/index'
import { parseIntersectionDef } from '../../parsers/intersection'
import { getRefs } from '../../Refs'

describe('intersections', () => {
  it('should be possible to use intersections', () => {
    const intersection = z.intersection(z.string().min(1), z.string().max(3))

    const jsonSchema = parseIntersectionDef(intersection._def, getRefs())

    expect(jsonSchema).toEqual({
      allOf: [
        {
          type: 'string',
          minLength: 1,
          [zuiKey]: {},
        },
        {
          type: 'string',
          maxLength: 3,
          [zuiKey]: {},
        },
      ],
    })
  })

  it('should be possible to deref intersections', () => {
    const schema = z.string()
    const intersection = z.intersection(schema, schema)
    const jsonSchema = parseIntersectionDef(intersection._def, getRefs())

    expect(jsonSchema).toEqual({
      allOf: [
        {
          type: 'string',
          [zuiKey]: {},
        },
        {
          $ref: '#/allOf/0',
        },
      ],
    })
  })

  it('should intersect complex objects correctly', () => {
    const schema1 = z.object({
      foo: z.string(),
    })
    const schema2 = z.object({
      bar: z.string(),
    })
    const intersection = z.intersection(schema1, schema2)
    const jsonSchema = parseIntersectionDef(intersection._def, getRefs({ target: 'jsonSchema2019-09' }))

    expect(jsonSchema).toEqual({
      allOf: [
        {
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['foo'],
          type: 'object',
          [zuiKey]: {},
        },
        {
          properties: {
            bar: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['bar'],
          type: 'object',
          [zuiKey]: {},
        },
      ],
      unevaluatedProperties: false,
    })
  })

  it('should return `unevaluatedProperties` only if all sub-schemas has additionalProperties set to false', () => {
    const schema1 = z.object({
      foo: z.string(),
    })
    const schema2 = z
      .object({
        bar: z.string(),
      })
      .passthrough()
    const intersection = z.intersection(schema1, schema2)
    const jsonSchema = parseIntersectionDef(intersection._def, getRefs({ target: 'jsonSchema2019-09' }))

    expect(jsonSchema).toEqual({
      allOf: [
        {
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['foo'],
          type: 'object',
          [zuiKey]: {},
        },
        {
          properties: {
            bar: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['bar'],
          type: 'object',
          additionalProperties: true,
          [zuiKey]: {},
        },
      ],
    })
  })

  it('should intersect multiple complex objects correctly', () => {
    const schema1 = z.object({
      foo: z.string(),
    })
    const schema2 = z.object({
      bar: z.string(),
    })
    const schema3 = z.object({
      baz: z.string(),
    })
    const intersection = schema1.and(schema2).and(schema3)
    const jsonSchema = parseIntersectionDef(intersection._def, getRefs({ target: 'jsonSchema2019-09' }))

    expect(jsonSchema).toEqual({
      allOf: [
        {
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['foo'],
          type: 'object',
          [zuiKey]: {},
        },
        {
          properties: {
            bar: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['bar'],
          type: 'object',
          [zuiKey]: {},
        },
        {
          properties: {
            baz: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['baz'],
          type: 'object',
          [zuiKey]: {},
        },
      ],
      unevaluatedProperties: false,
    })
  })

  it('should return `unevaluatedProperties` only if all of the multiple sub-schemas has additionalProperties set to false', () => {
    const schema1 = z.object({
      foo: z.string(),
    })
    const schema2 = z.object({
      bar: z.string(),
    })
    const schema3 = z
      .object({
        baz: z.string(),
      })
      .passthrough()
    const intersection = schema1.and(schema2).and(schema3)
    const jsonSchema = parseIntersectionDef(intersection._def, getRefs({ target: 'jsonSchema2019-09' }))

    expect(jsonSchema).toEqual({
      allOf: [
        {
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['foo'],
          type: 'object',
          [zuiKey]: {},
        },
        {
          properties: {
            bar: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['bar'],
          type: 'object',
          [zuiKey]: {},
        },
        {
          additionalProperties: true,
          properties: {
            baz: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['baz'],
          type: 'object',
          [zuiKey]: {},
        },
      ],
    })
  })
})
