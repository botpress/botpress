import { describe, it, expect } from 'vitest'
import { zuiKey } from '../../../ui/constants'
import { z } from '../../../z/index'
import { zodToJsonSchema } from '../zodToJsonSchema'

describe('Root schema result after parsing', () => {
  it('should return the schema directly in the root if no name is passed', () => {
    expect(zodToJsonSchema(z.any())).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      [zuiKey]: {},
    })
  })
  it('should return the schema inside a named property in "definitions" if a name is passed', () => {
    expect(zodToJsonSchema(z.any(), 'MySchema')).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: `#/definitions/MySchema`,
      definitions: {
        MySchema: { [zuiKey]: {} },
      },
    })
  })

  it('should return the schema inside a named property in "$defs" if a name and definitionPath is passed in options', () => {
    expect(zodToJsonSchema(z.any(), { name: 'MySchema', definitionPath: '$defs' })).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: `#/$defs/MySchema`,
      $defs: {
        MySchema: { [zuiKey]: {} },
      },
    })
  })

  it("should not scrub 'any'-schemas from unions when strictUnions=false", () => {
    expect(
      zodToJsonSchema(z.union([z.any(), z.instanceof(String), z.string(), z.number()]), { strictUnions: false }),
    ).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      anyOf: [{ [zuiKey]: {} }, { [zuiKey]: {} }, { type: 'string', [zuiKey]: {} }, { type: 'number', [zuiKey]: {} }],
      [zuiKey]: {},
    })
  })

  it("should scrub 'any'-schemas from unions when strictUnions=true", () => {
    expect(
      zodToJsonSchema(z.union([z.any(), z.instanceof(String), z.string(), z.number()]), { strictUnions: true }),
    ).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      anyOf: [{ [zuiKey]: {} }, { [zuiKey]: {} }, { type: 'string', [zuiKey]: {} }, { type: 'number', [zuiKey]: {} }],
      [zuiKey]: {},
    })
  })

  it("should scrub 'any'-schemas from unions when strictUnions=true in objects", () => {
    expect(
      zodToJsonSchema(
        z.object({
          field: z.union([z.any(), z.instanceof(String), z.string(), z.number()]),
        }),
        { strictUnions: true },
      ),
    ).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      additionalProperties: false,
      properties: {
        field: {
          anyOf: [
            { [zuiKey]: {} },
            { [zuiKey]: {} },
            { type: 'string', [zuiKey]: {} },
            { type: 'number', [zuiKey]: {} },
          ],
          [zuiKey]: {},
        },
      },
      type: 'object',
      [zuiKey]: {},
    })
  })

  it('Definitions play nice with named schemas', () => {
    const MySpecialStringSchema = z.string()
    const MyArraySchema = z.array(MySpecialStringSchema)

    const result = zodToJsonSchema(MyArraySchema, {
      definitions: {
        MySpecialStringSchema,
        MyArraySchema,
      },
    })

    expect(result).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/MyArraySchema',
      definitions: {
        MySpecialStringSchema: { type: 'string', [zuiKey]: {} },
        MyArraySchema: {
          type: 'array',
          items: {
            $ref: '#/definitions/MySpecialStringSchema',
          },
          [zuiKey]: {},
        },
      },
    })
  })
})
