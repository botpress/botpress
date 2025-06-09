import { describe, it, expect } from 'vitest'
import z from '../z'
import { toJsonSchema } from './zui-to-json-schema-next'
import { fromJsonSchema } from './json-schema-to-zui-next'
import * as errors from './common/errors'

const assert = (src: z.Schema) => ({
  toTransformBackToItself: () => {
    const jsonSchema = toJsonSchema(src)
    const actual = fromJsonSchema(jsonSchema)
    const expected = src
    let msg: string | undefined = undefined
    try {
      msg = `Expected ${actual.toTypescriptSchema()} to equal ${expected.toTypescriptSchema()}`
    } catch {}
    const result = actual.isEqual(expected)
    expect(result, msg).toBe(true)
  },
})

describe.concurrent('transformPipeline', () => {
  describe.concurrent('ZodString', async () => {
    it('should map a string to itself', async () => {
      // Arrange
      const srcSchema = z.string()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a string with min to itself', async () => {
      // Arrange
      const srcSchema = z.string().min(1)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with max to itself', async () => {
      // Arrange
      const srcSchema = z.string().max(1)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with length to itself', async () => {
      // Arrange
      const srcSchema = z.string().length(1)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with email to itself', async () => {
      // Arrange
      const srcSchema = z.string().email()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with url to itself', async () => {
      // Arrange
      const srcSchema = z.string().url()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with emoji to itself', async () => {
      // Arrange
      const srcSchema = z.string().emoji()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with uuid to itself', async () => {
      // Arrange
      const srcSchema = z.string().uuid()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with cuid to itself', async () => {
      // Arrange
      const srcSchema = z.string().cuid()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with cuid2 to itself', async () => {
      // Arrange
      const srcSchema = z.string().cuid2()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with ulid to itself', async () => {
      // Arrange
      const srcSchema = z.string().ulid()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with regex to itself', async () => {
      // Arrange
      const srcSchema = z.string().regex(/foo/)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with datetime to itself', async () => {
      // Arrange
      const srcSchema = z.string().datetime()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with datetime and precision/offset to itself', async () => {
      // Arrange
      const srcSchema = z.string().datetime({ offset: true, precision: 2 })

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with ip to itself', async () => {
      // Arrange
      const srcSchema = z.string().ip()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
    it('should map a string with includes to a matching regex', async () => {
      // Arrange
      const srcSchema = z.string().includes('foo')

      // Act
      const dstSchema = fromJsonSchema(toJsonSchema(srcSchema)) as z.ZodString

      // Assert
      const check = dstSchema._def.checks[0]
      expect(check?.kind).toBe('regex')
      expect(check?.kind === 'regex' && check.regex.source).toBe('foo')
    })
    it('should map a string with startsWith to a matching regex', async () => {
      // Arrange
      const srcSchema = z.string().startsWith('foo')

      // Act
      const dstSchema = fromJsonSchema(toJsonSchema(srcSchema)) as z.ZodString

      // Assert
      const check = dstSchema._def.checks[0]
      expect(check?.kind).toBe('regex')
      expect(check?.kind === 'regex' && check.regex.source).toBe('^foo')
    })
    it('should map a string with endsWith to a matching regex', async () => {
      // Arrange
      const srcSchema = z.string().endsWith('foo')

      // Act
      const dstSchema = fromJsonSchema(toJsonSchema(srcSchema)) as z.ZodString

      // Assert
      const check = dstSchema._def.checks[0]
      expect(check?.kind).toBe('regex')
      expect(check?.kind === 'regex' && check.regex.source).toBe('foo$')
    })
    it('throws UnsupportedZuiCheckToJsonSchemaError when using .trim', async () => {
      // Arrange
      const srcSchema = z.string().trim()

      // Act
      const act = () => toJsonSchema(srcSchema)

      // Assert
      expect(act).toThrowError(errors.UnsupportedZuiCheckToJsonSchemaError)
    })
    it('throws UnsupportedZuiCheckToJsonSchemaError when using .toLowerCase', async () => {
      // Arrange
      const srcSchema = z.string().toLowerCase()

      // Act
      const act = () => toJsonSchema(srcSchema)

      // Assert
      expect(act).toThrowError(errors.UnsupportedZuiCheckToJsonSchemaError)
    })
    it('throws UnsupportedZuiCheckToJsonSchemaError when using .toUpperCase', async () => {
      // Arrange
      const srcSchema = z.string().toUpperCase()

      // Act
      const act = () => toJsonSchema(srcSchema)

      // Assert
      expect(act).toThrowError(errors.UnsupportedZuiCheckToJsonSchemaError)
    })
  })

  describe.concurrent('ZodNumber', async () => {
    it('should map a number to itself', async () => {
      // Arrange
      const srcSchema = z.number()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map an int to itself', async () => {
      // Arrange
      const srcSchema = z.number().int()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with gt to itself', async () => {
      // Arrange
      const srcSchema = z.number().gt(5)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with gte to itself', async () => {
      // Arrange
      const srcSchema = z.number().gte(5)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with min to itself', async () => {
      // Arrange
      const srcSchema = z.number().min(5)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with lt to itself', async () => {
      // Arrange
      const srcSchema = z.number().lt(5)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with lte to itself', async () => {
      // Arrange
      const srcSchema = z.number().lte(5)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with max to itself', async () => {
      // Arrange
      const srcSchema = z.number().max(5)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with positive to itself', async () => {
      // Arrange
      const srcSchema = z.number().positive()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with nonnegative to itself', async () => {
      // Arrange
      const srcSchema = z.number().nonnegative()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with negative to itself', async () => {
      // Arrange
      const srcSchema = z.number().negative()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with nonpositive to itself', async () => {
      // Arrange
      const srcSchema = z.number().nonpositive()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with multipleOf to itself', async () => {
      // Arrange
      const srcSchema = z.number().multipleOf(5)

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with finite to itself', async () => {
      // Arrange
      const srcSchema = z.number().finite()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map a number with safe to itself', async () => {
      // Arrange
      const srcSchema = z.number().safe()

      // Act & Assert
      assert(srcSchema).toTransformBackToItself()
    })
  })

  it('should throw UnsupportedZuiToJsonSchemaError for ZodBigInt', async () => {
    // Arrange
    const srcSchema = z.bigint()

    // Act
    const act = () => toJsonSchema(srcSchema)

    // Assert
    expect(act).toThrowError(errors.UnsupportedZuiToJsonSchemaError)
  })

  it('should map ZodBoolean to itself', async () => {
    const srcSchema = z.boolean()
    assert(srcSchema).toTransformBackToItself()
  })

  it('should throw UnsupportedZuiToJsonSchemaError for ZodDate', async () => {
    // Arrange
    const srcSchema = z.date()

    // Act
    const act = () => toJsonSchema(srcSchema)

    // Assert
    expect(act).toThrowError(errors.UnsupportedZuiToJsonSchemaError)
  })

  it('should map ZodUndefined to itself', async () => {
    const srcSchema = z.undefined()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodNull to itself', async () => {
    const srcSchema = z.null()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodAny to itself', async () => {
    const srcSchema = z.any()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodUnknown to itself', async () => {
    const srcSchema = z.unknown()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodNever to itself', async () => {
    const srcSchema = z.never()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodArray to itself', async () => {
    const srcSchema = z.array(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodObject to itself', async () => {
    const srcSchema = z.object({ foo: z.string() }).strict()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map empty ZodObject to itself', async () => {
    const srcSchema = z.object({}).strict()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodUnion to itself', async () => {
    const srcSchema = z.union([z.string(), z.number()])
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodIntersection to itself', async () => {
    const srcSchema = z.intersection(
      z.object({ type: z.literal('foo'), foo: z.string() }),
      z.object({ type: z.literal('bar'), bar: z.number() }),
    )
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodTuple to itself', async () => {
    const srcSchema = z.tuple([z.string(), z.number()])
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map empty ZodTuple to itself', async () => {
    const srcSchema = z.tuple([])
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodRecord to itself', async () => {
    const srcSchema = z.record(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodSet to itself', async () => {
    const srcSchema = z.set(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodLiteral to itself', async () => {
    const srcSchema = z.literal('foo')
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodEnum to itself', async () => {
    const srcSchema = z.enum(['foo', 'bar'])
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodOptional to itself', async () => {
    const srcSchema = z.optional(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodNullable to itself', async () => {
    const srcSchema = z.nullable(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodDefault to itself', async () => {
    const srcSchema = z.default(z.string(), 'foo')
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodReadonly to itself', async () => {
    const srcSchema = z.readonly(z.string())
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodRef to itself', async () => {
    const srcSchema = z.ref('foo')
    assert(srcSchema).toTransformBackToItself()
  })
})
