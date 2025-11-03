import { describe, it, expect } from 'vitest'
import { z } from '@bpinternal/zui'
import { JsonParsingError } from '../src/operations/errors'

describe('JsonParsingError', () => {
  it('formats simple zod validation error in LLM-friendly way', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })

    try {
      schema.parse({ name: 'John', age: 'not a number' })
    } catch (error) {
      const jsonParsingError = new JsonParsingError('{"name":"John","age":"not a number"}', error as Error)

      expect(jsonParsingError.message).toMatchInlineSnapshot(`
        "Error parsing JSON:

        ---JSON---
        {"name":"John","age":"not a number"}

        ---Validation Errors---

        1. Field: "age"
           Problem: Expected number, but received string
           Message: Expected number, received string
        "
      `)
    }
  })

  it('formats complex nested zod validation error in LLM-friendly way', () => {
    const schema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
      age: z.number().positive(),
      address: z.object({
        street: z.string(),
        city: z.string(),
        zipCode: z.string().length(5),
      }),
      tags: z.array(z.string()),
    })

    try {
      schema.parse({
        name: 'Jo',
        email: 'invalid-email',
        age: -5,
        address: {
          street: 'Main St',
          city: '',
          zipCode: '1234',
        },
        tags: ['valid', 123, null],
      })
    } catch (error) {
      const jsonParsingError = new JsonParsingError(
        JSON.stringify({
          name: 'Jo',
          email: 'invalid-email',
          age: -5,
          address: { street: 'Main St', city: '', zipCode: '1234' },
          tags: ['valid', 123, null],
        }),
        error as Error
      )

      expect(jsonParsingError.message).toMatchInlineSnapshot(`
        "Error parsing JSON:

        ---JSON---
        {"name":"Jo","email":"invalid-email","age":-5,"address":{"street":"Main St","city":"","zipCode":"1234"},"tags":["valid",123,null]}

        ---Validation Errors---

        1. Field: "name"
           Problem: String must be at least 3 characters
           Message: String must contain at least 3 character(s)

        2. Field: "email"
           Problem: Invalid email format
           Message: Invalid email

        3. Field: "age"
           Problem: Number must be greater than 0
           Message: Number must be greater than 0

        4. Field: "address.zipCode"
           Problem: String must be exactly 5 characters
           Message: String must contain exactly 5 character(s)

        5. Field: "tags.1"
           Problem: Expected string, but received number
           Message: Expected string, received number

        6. Field: "tags.2"
           Problem: Expected string, but received null
           Message: Expected string, received null
        "
      `)
    }
  })

  it('formats array validation error in LLM-friendly way', () => {
    const schema = z.array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )

    try {
      schema.parse([
        { id: 1, name: 'Valid' },
        { id: 'invalid', name: 'Invalid ID' },
        { id: 3, name: 123 },
      ])
    } catch (error) {
      const jsonParsingError = new JsonParsingError(
        JSON.stringify([
          { id: 1, name: 'Valid' },
          { id: 'invalid', name: 'Invalid ID' },
          { id: 3, name: 123 },
        ]),
        error as Error
      )

      expect(jsonParsingError.message).toMatchInlineSnapshot(`
        "Error parsing JSON:

        ---JSON---
        [{"id":1,"name":"Valid"},{"id":"invalid","name":"Invalid ID"},{"id":3,"name":123}]

        ---Validation Errors---

        1. Field: "1.id"
           Problem: Expected number, but received string
           Message: Expected number, received string

        2. Field: "2.name"
           Problem: Expected string, but received number
           Message: Expected string, received number
        "
      `)
    }
  })

  it('formats missing required field error in LLM-friendly way', () => {
    const schema = z.object({
      requiredField: z.string(),
      optionalField: z.string().optional(),
    })

    try {
      schema.parse({ optionalField: 'present' })
    } catch (error) {
      const jsonParsingError = new JsonParsingError('{"optionalField":"present"}', error as Error)

      expect(jsonParsingError.message).toMatchInlineSnapshot(`
        "Error parsing JSON:

        ---JSON---
        {"optionalField":"present"}

        ---Validation Errors---

        1. Field: "requiredField"
           Problem: Expected string, but received undefined
           Message: Required
        "
      `)
    }
  })

  it('formats union/enum validation error in LLM-friendly way', () => {
    const schema = z.object({
      status: z.enum(['pending', 'approved', 'rejected']),
      priority: z.union([z.literal('low'), z.literal('medium'), z.literal('high')]),
    })

    try {
      schema.parse({ status: 'invalid-status', priority: 'urgent' })
    } catch (error) {
      const jsonParsingError = new JsonParsingError('{"status":"invalid-status","priority":"urgent"}', error as Error)

      expect(jsonParsingError.message).toMatchInlineSnapshot(`
        "Error parsing JSON:

        ---JSON---
        {"status":"invalid-status","priority":"urgent"}

        ---Validation Errors---

        1. Field: "status"
           Problem: Invalid value "invalid-status"
           Allowed values: "pending", "approved", "rejected"
           Message: Invalid enum value. Expected 'pending' | 'approved' | 'rejected', received 'invalid-status'

        2. Field: "priority"
           Problem: Value doesn't match any of the expected formats
           Message: Invalid input
        "
      `)
    }
  })

  it('formats type mismatch errors in LLM-friendly way', () => {
    const schema = z.object({
      string: z.string(),
      number: z.number(),
      boolean: z.boolean(),
      array: z.array(z.string()),
      object: z.object({ nested: z.string() }),
    })

    try {
      schema.parse({
        string: 123,
        number: 'not a number',
        boolean: 'yes',
        array: 'not an array',
        object: 'not an object',
      })
    } catch (error) {
      const jsonParsingError = new JsonParsingError(
        JSON.stringify({
          string: 123,
          number: 'not a number',
          boolean: 'yes',
          array: 'not an array',
          object: 'not an object',
        }),
        error as Error
      )

      expect(jsonParsingError.message).toMatchInlineSnapshot(`
        "Error parsing JSON:

        ---JSON---
        {"string":123,"number":"not a number","boolean":"yes","array":"not an array","object":"not an object"}

        ---Validation Errors---

        1. Field: "string"
           Problem: Expected string, but received number
           Message: Expected string, received number

        2. Field: "number"
           Problem: Expected number, but received string
           Message: Expected number, received string

        3. Field: "boolean"
           Problem: Expected boolean, but received string
           Message: Expected boolean, received string

        4. Field: "array"
           Problem: Expected array, but received string
           Message: Expected array, received string

        5. Field: "object"
           Problem: Expected object, but received string
           Message: Expected object, received string
        "
      `)
    }
  })

  it('handles non-zod errors gracefully', () => {
    const regularError = new Error('This is a regular parsing error')
    const jsonParsingError = new JsonParsingError('{"invalid json"}', regularError)

    expect(jsonParsingError.message).toMatchInlineSnapshot(`
      "Error parsing JSON:

      ---JSON---
      {"invalid json"}

      ---Error---

      The JSON provided is not valid JSON.
      Details: This is a regular parsing error
      "
    `)
  })
})
