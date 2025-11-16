import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { Exit } from './exit.js'
import { parseExit } from './exit-parser.js'

describe('exit parser', () => {
  describe('basic parsing', () => {
    it('returns error when no return value provided', () => {
      const exits = [new Exit({ name: 'done', description: 'Complete' })]
      const result = parseExit(null, exits)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('No return value provided')
      }
    })

    it('returns error when no action in return value', () => {
      const exits = [new Exit({ name: 'done', description: 'Complete' })]
      const result = parseExit({ action: '' } as any, exits)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('did not return an action')
      }
    })

    it('returns error when exit not found', () => {
      const exits = [new Exit({ name: 'done', description: 'Complete' })]
      const result = parseExit({ action: 'unknown' }, exits)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Exit "unknown" not found')
        expect(result.error).toContain('done')
      }
    })

    it('finds exit by name (case-insensitive)', () => {
      const exits = [new Exit({ name: 'done', description: 'Complete' })]
      const result = parseExit({ action: 'DONE' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.exit.name).toBe('done')
      }
    })

    it('finds exit by alias (case-insensitive)', () => {
      const exits = [new Exit({ name: 'done', aliases: ['complete', 'finish'], description: 'Complete' })]
      const result = parseExit({ action: 'COMPLETE' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.exit.name).toBe('done')
      }
    })
  })

  describe('exit without schema', () => {
    it('extracts value from .value property', () => {
      const exits = [new Exit({ name: 'done', description: 'Complete' })]
      const result = parseExit({ action: 'done', value: 'hello' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toBe('hello')
      }
    })

    it('extracts value from other single property', () => {
      const exits = [new Exit({ name: 'done', description: 'Complete' })]
      const result = parseExit({ action: 'done', result: 'hello' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toBe('hello')
      }
    })

    it('extracts all properties when multiple exist', () => {
      const exits = [new Exit({ name: 'done', description: 'Complete' })]
      const result = parseExit({ action: 'done', foo: 'bar', baz: 123 }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ foo: 'bar', baz: 123 })
      }
    })
  })

  describe('exit with simple object schema', () => {
    it('validates correct data', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ message: z.string(), count: z.number() }),
        }),
      ]
      const result = parseExit({ action: 'done', value: { message: 'hello', count: 5 } }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ message: 'hello', count: 5 })
      }
    })

    it('returns error for invalid data', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ message: z.string() }),
        }),
      ]
      const result = parseExit({ action: 'done', value: { message: 123 } }, exits)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid return value for exit "done"')
        expect(result.error).toContain('You generated:')
        expect(result.error).toContain('But expected one of:')
      }
    })
  })

  describe('smart wrapping - primitive to object', () => {
    it('wraps primitive in { result } when schema expects object with result', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ result: z.string() }),
        }),
      ]
      const result = parseExit({ action: 'done', value: 'hello' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ result: 'hello' })
      }
    })

    it('wraps primitive in { value } when schema expects object with value', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ value: z.string() }),
        }),
      ]
      const result = parseExit({ action: 'done', data: 'hello' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ value: 'hello' })
      }
    })

    it('wraps primitive in { data } when schema expects object with data', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ data: z.number() }),
        }),
      ]
      const result = parseExit({ action: 'done', value: 42 }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ data: 42 })
      }
    })

    it('tries multiple wrapping strategies in order', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ value: z.string(), extra: z.string().optional() }),
        }),
      ]
      const result = parseExit({ action: 'done', foo: 'hello' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ value: 'hello' })
      }
    })

    it('wraps arrays correctly', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ result: z.array(z.number()) }),
        }),
      ]
      const result = parseExit({ action: 'done', value: [1, 2, 3] }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ result: [1, 2, 3] })
      }
    })
  })

  describe('smart wrapping - discriminated unions', () => {
    it('adds discriminator to object missing it', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.discriminatedUnion('success', [
            z.object({ success: z.literal(true), result: z.string() }),
            z.object({ success: z.literal(false), error: z.string() }),
          ]),
        }),
      ]
      const result = parseExit({ action: 'done', value: { result: 'hello' } }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ success: true, result: 'hello' })
      }
    })

    it('wraps primitive with discriminator and property when unambiguous', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.discriminatedUnion('success', [
            z.object({ success: z.literal(true), result: z.string() }),
            z.object({ success: z.literal(false), count: z.number() }), // Different type to avoid ambiguity
          ]),
        }),
      ]
      const result = parseExit({ action: 'done', value: 'hello' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ success: true, result: 'hello' })
      }
    })

    it('chooses correct union variant based on properties', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.discriminatedUnion('success', [
            z.object({ success: z.literal(true), result: z.string() }),
            z.object({ success: z.literal(false), error: z.string() }),
          ]),
        }),
      ]
      const result = parseExit({ action: 'done', value: { error: 'failed' } }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ success: false, error: 'failed' })
      }
    })
  })

  describe('multiple exits', () => {
    it('selects correct exit from multiple options', () => {
      const exits = [
        new Exit({
          name: 'success',
          description: 'Success',
          schema: z.object({ result: z.string() }),
        }),
        new Exit({
          name: 'error',
          description: 'Error',
          schema: z.object({ message: z.string() }),
        }),
        new Exit({
          name: 'pending',
          description: 'Pending',
          schema: z.object({ reason: z.string() }),
        }),
      ]

      const result1 = parseExit({ action: 'success', value: 'done' }, exits)
      expect(result1.success).toBe(true)
      if (result1.success) {
        expect(result1.exit.name).toBe('success')
        expect(result1.value).toEqual({ result: 'done' })
      }

      const result2 = parseExit({ action: 'error', value: 'oops' }, exits)
      expect(result2.success).toBe(true)
      if (result2.success) {
        expect(result2.exit.name).toBe('error')
        expect(result2.value).toEqual({ message: 'oops' })
      }

      const result3 = parseExit({ action: 'pending', value: 'waiting' }, exits)
      expect(result3.success).toBe(true)
      if (result3.success) {
        expect(result3.exit.name).toBe('pending')
        expect(result3.value).toEqual({ reason: 'waiting' })
      }
    })

    it('fits data to correct exit even with ambiguous return', () => {
      const exits = [
        new Exit({
          name: 'email',
          description: 'Email result',
          schema: z.object({ email: z.string().email() }),
        }),
        new Exit({
          name: 'url',
          description: 'URL result',
          schema: z.object({ url: z.string().url() }),
        }),
      ]

      // Both exits could wrap a string in different ways, but should match by schema validation
      const result1 = parseExit({ action: 'email', value: 'test@example.com' }, exits)
      expect(result1.success).toBe(true)
      if (result1.success) {
        expect(result1.exit.name).toBe('email')
        expect(result1.value).toEqual({ email: 'test@example.com' })
      }
    })
  })

  describe('edge cases', () => {
    it('handles return value with action and value both set', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ data: z.string() }),
        }),
      ]
      const result = parseExit({ action: 'done', value: 'hello' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ data: 'hello' })
      }
    })

    it('handles return value with action and other property (not value)', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ result: z.string() }),
        }),
      ]
      const result = parseExit({ action: 'done', result: 'hello' }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ result: 'hello' })
      }
    })

    it('handles null and undefined values', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ value: z.string().nullable() }),
        }),
      ]
      const result = parseExit({ action: 'done', value: null }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ value: null })
      }
    })

    it('returns error when data truly cannot fit schema', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ email: z.string().email(), age: z.number().min(0) }),
        }),
      ]
      const result = parseExit({ action: 'done', value: 'not-an-email' }, exits)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid return value for exit "done"')
        expect(result.error).toContain('You generated:')
        expect(result.error).toContain('But expected one of:')
      }
    })

    it('handles complex nested schemas', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({
            user: z.object({
              name: z.string(),
              age: z.number(),
            }),
            metadata: z.record(z.any()),
          }),
        }),
      ]
      const result = parseExit(
        {
          action: 'done',
          value: {
            user: { name: 'Alice', age: 30 },
            metadata: { role: 'admin' },
          },
        },
        exits
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({
          user: { name: 'Alice', age: 30 },
          metadata: { role: 'admin' },
        })
      }
    })

    it('preserves exact data when it already matches schema', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({ result: z.string(), extra: z.number().optional() }),
        }),
      ]
      const result = parseExit({ action: 'done', value: { result: 'hello', extra: 42 } }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ result: 'hello', extra: 42 })
      }
    })
  })

  describe('real-world scenarios', () => {
    it('handles DefaultExit with success result', () => {
      const DefaultExit = new Exit({
        name: 'done',
        description: 'Complete',
        schema: z.discriminatedUnion('success', [
          z.object({ success: z.literal(true), result: z.any() }),
          z.object({ success: z.literal(false), error: z.string() }),
        ]),
      })

      // This is ambiguous - both { success: true, result: ... } and { success: false, error: ... }
      // could potentially match depending on the data, so we should fail instead of guessing
      const result = parseExit({ action: 'done', result: { foo: 'bar' } }, [DefaultExit])

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid return value for exit "done"')
      }
    })

    it('handles DefaultExit with explicit discriminator', () => {
      const DefaultExit = new Exit({
        name: 'done',
        description: 'Complete',
        schema: z.discriminatedUnion('success', [
          z.object({ success: z.literal(true), result: z.any() }),
          z.object({ success: z.literal(false), error: z.string() }),
        ]),
      })

      // When we provide the discriminator explicitly, it works
      const result = parseExit({ action: 'done', value: { success: false, error: 'Something went wrong' } }, [
        DefaultExit,
      ])

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ success: false, error: 'Something went wrong' })
      }
    })

    it('handles custom exit with validation constraints', () => {
      const exits = [
        new Exit({
          name: 'createUser',
          description: 'Create user',
          schema: z.object({
            email: z.string().email(),
            age: z.number().min(18).max(120),
            username: z.string().min(3).max(20),
          }),
        }),
      ]

      const result = parseExit(
        {
          action: 'createUser',
          value: {
            email: 'user@example.com',
            age: 25,
            username: 'alice',
          },
        },
        exits
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({
          email: 'user@example.com',
          age: 25,
          username: 'alice',
        })
      }
    })

    it('handles exit with optional fields using defaults', () => {
      const exits = [
        new Exit({
          name: 'done',
          description: 'Complete',
          schema: z.object({
            message: z.string(),
            priority: z.enum(['low', 'medium', 'high']).default('medium'),
          }),
        }),
      ]

      const result = parseExit({ action: 'done', value: { message: 'hello' } }, exits)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({ message: 'hello', priority: 'medium' })
      }
    })
  })
})
