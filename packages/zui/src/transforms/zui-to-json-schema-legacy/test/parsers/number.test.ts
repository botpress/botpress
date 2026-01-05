import { describe, it, expect } from 'vitest'
import { JSONSchema7Type } from 'json-schema'
import { z } from '../../../../z/index'
import { parseNumberDef } from '../../parsers/number'
import { getRefs } from '../../Refs'
import { errorReferences } from './errorReferences'

describe('Number validations', () => {
  it('should be possible to describe minimum number', () => {
    const parsedSchema = parseNumberDef(z.number().min(5)._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
      minimum: 5,
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })
  it('should be possible to describe maximum number', () => {
    const parsedSchema = parseNumberDef(z.number().max(5)._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
      maximum: 5,
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })
  it('should be possible to describe both minimum and maximum number', () => {
    const parsedSchema = parseNumberDef(z.number().min(5).max(5)._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
      minimum: 5,
      maximum: 5,
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })
  it('should be possible to describe an integer', () => {
    const parsedSchema = parseNumberDef(z.number().int()._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'integer',
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should be possible to describe multiples of n', () => {
    const parsedSchema = parseNumberDef(z.number().multipleOf(2)._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
      multipleOf: 2,
    }
    expect(parsedSchema).toEqual(jsonSchema)
  })

  it('should be possible to describe positive, negative, nonpositive and nonnegative numbers', () => {
    const parsedSchema = parseNumberDef(z.number().positive().negative().nonpositive().nonnegative()._def, getRefs())
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
      minimum: 0,
      maximum: 0,
      exclusiveMaximum: 0,
      exclusiveMinimum: 0,
    }

    expect(parsedSchema).toEqual(jsonSchema)
  })
  it("should include custom error messages for inclusive checks if they're passed", () => {
    const minErrorMessage = 'Number must be at least 5'
    const maxErrorMessage = 'Number must be at most 10'
    const zodNumberSchema = z.number().gte(5, minErrorMessage).lte(10, maxErrorMessage)
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
      minimum: 5,
      maximum: 10,
      errorMessage: {
        minimum: minErrorMessage,
        maximum: maxErrorMessage,
      },
    }
    const jsonParsedSchema = parseNumberDef(zodNumberSchema._def, errorReferences())
    expect(jsonParsedSchema).toEqual(jsonSchema)
  })
  it("should include custom error messages for exclusive checks if they're passed", () => {
    const minErrorMessage = 'Number must be greater than 5'
    const maxErrorMessage = 'Number must less than 10'
    const zodNumberSchema = z.number().gt(5, minErrorMessage).lt(10, maxErrorMessage)
    const jsonSchema: JSONSchema7Type = {
      type: 'number',
      exclusiveMinimum: 5,
      exclusiveMaximum: 10,
      errorMessage: {
        exclusiveMinimum: minErrorMessage,
        exclusiveMaximum: maxErrorMessage,
      },
    }
    const jsonParsedSchema = parseNumberDef(zodNumberSchema._def, errorReferences())
    expect(jsonParsedSchema).toEqual(jsonSchema)
  })
  it("should include custom error messages for multipleOf and int if they're passed", () => {
    const intErrorMessage = 'Must be an integer'
    const multipleOfErrorMessage = 'Must be a multiple of 5'
    const jsonSchema: JSONSchema7Type = {
      type: 'integer',
      multipleOf: 5,
      errorMessage: {
        type: intErrorMessage,
        multipleOf: multipleOfErrorMessage,
      },
    }
    const zodNumberSchema = z.number().multipleOf(5, multipleOfErrorMessage).int(intErrorMessage)
    const jsonParsedSchema = parseNumberDef(zodNumberSchema._def, errorReferences())

    expect(jsonParsedSchema).toEqual(jsonSchema)
  })
  it("should not include errorMessage property if they're not passed", () => {
    const zodNumberSchemas = [
      z.number().lt(5),
      z.number().gt(5),
      z.number().gte(5),
      z.number().lte(5),
      z.number().multipleOf(5),
      z.number().int(),
      z.number().int().multipleOf(5).lt(5).gt(3).lte(4).gte(3),
    ]
    const jsonParsedSchemas = zodNumberSchemas.map((schema) => parseNumberDef(schema._def, errorReferences()))
    for (const jsonParsedSchema of jsonParsedSchemas) {
      expect(jsonParsedSchema).not.toHaveProperty('errorMessage')
    }
  })
  it("should not include error messages if error message isn't explicitly set to true in References constructor", () => {
    const zodNumberSchemas = [
      z.number().lt(5),
      z.number().gt(5),
      z.number().gte(5),
      z.number().lte(5),
      z.number().multipleOf(5),
      z.number().int(),
    ]
    for (const schema of zodNumberSchemas) {
      const jsonParsedSchema = parseNumberDef(schema._def, getRefs())
      expect(jsonParsedSchema).not.toHaveProperty('errorMessage')
    }
  })
})
