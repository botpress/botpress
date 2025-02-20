import { describe, it, expect } from 'vitest'
import z from '../z'
import { toJsonSchema } from './zui-to-json-schema-next'
import { fromJsonSchema } from './json-schema-to-zui-next'

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

describe('transformPipeline', () => {
  describe('ZodString', async () => {
    it('should map a string to itself', async () => {
      const srcSchema = z.string()
      assert(srcSchema).toTransformBackToItself()
    })

    // TODO: enable and fix these tests

    it.skip('should map a string with min to itself', async () => {
      const srcSchema = z.string().min(1)
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with max to itself', async () => {
      const srcSchema = z.string().max(1)
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with length to itself', async () => {
      const srcSchema = z.string().length(1)
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with email to itself', async () => {
      const srcSchema = z.string().email()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with url to itself', async () => {
      const srcSchema = z.string().url()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with emoji to itself', async () => {
      const srcSchema = z.string().emoji()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with uuid to itself', async () => {
      const srcSchema = z.string().uuid()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with cuid to itself', async () => {
      const srcSchema = z.string().cuid()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with includes to itself', async () => {
      const srcSchema = z.string().includes('foo')
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with cuid2 to itself', async () => {
      const srcSchema = z.string().cuid2()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with ulid to itself', async () => {
      const srcSchema = z.string().ulid()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with startsWith to itself', async () => {
      const srcSchema = z.string().startsWith('foo')
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with endsWith to itself', async () => {
      const srcSchema = z.string().endsWith('foo')
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with regex to itself', async () => {
      const srcSchema = z.string().regex(/foo/)
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with trim to itself', async () => {
      const srcSchema = z.string().trim()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with toLowerCase to itself', async () => {
      const srcSchema = z.string().toLowerCase()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with toUpperCase to itself', async () => {
      const srcSchema = z.string().toUpperCase()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with datetime to itself', async () => {
      const srcSchema = z.string().datetime()
      assert(srcSchema).toTransformBackToItself()
    })
    it.skip('should map a string with ip to itself', async () => {
      const srcSchema = z.string().ip()
      assert(srcSchema).toTransformBackToItself()
    })
  })

  describe('ZodNumber', async () => {
    it('should map a number to itself', async () => {
      const srcSchema = z.number()
      assert(srcSchema).toTransformBackToItself()
    })

    it('should map an int to itself', async () => {
      const srcSchema = z.number().int()
      assert(srcSchema).toTransformBackToItself()
    })
  })

  it('should map ZodBigInt to itself', async () => {
    const srcSchema = z.bigint()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodBoolean to itself', async () => {
    const srcSchema = z.boolean()
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodDate to itself', async () => {
    const srcSchema = z.date()
    assert(srcSchema).toTransformBackToItself()
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
    const srcSchema = z.object({ foo: z.string() })
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map empty ZodObject to itself', async () => {
    const srcSchema = z.object({})
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodUnion to itself', async () => {
    const srcSchema = z.union([z.string(), z.number()])
    assert(srcSchema).toTransformBackToItself()
  })
  it('should map ZodDiscriminatedUnion to itself', async () => {
    const srcSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('foo'), foo: z.string() }),
      z.object({ type: z.literal('bar'), bar: z.number() }),
    ])
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
