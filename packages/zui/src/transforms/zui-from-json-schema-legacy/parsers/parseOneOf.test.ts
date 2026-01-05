import { describe, it, expect } from 'vitest'
import { parseOneOf } from './parseOneOf'

describe('parseOneOf', () => {
  it('should create a union from two or more schemas', () => {
    expect(
      parseOneOf(
        {
          oneOf: [
            {
              type: 'string',
            },
            { type: 'number' },
          ],
        },
        { path: [], seen: new Map() },
      ),
    ).toStrictEqual(
      `z.any().superRefine((x, ctx) => {
    const schemas = [z.string(), z.number()];
    const errors = schemas.reduce(
      (errors: z.ZodError[], schema) =>
        ((result) => ("error" in result ? [...errors, result.error] : errors))(
          schema.safeParse(x)
        ),
      []
    );
    if (schemas.length - errors.length !== 1) {
      ctx.addIssue({
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema",
      });
    }
  })`,
    )
  })

  it('should extract a single schema', () => {
    expect(parseOneOf({ oneOf: [{ type: 'string' }] }, { path: [], seen: new Map() })).toStrictEqual('z.string()')
  })

  it('should return z.any() if array is empty', () => {
    expect(parseOneOf({ oneOf: [] }, { path: [], seen: new Map() })).toStrictEqual('z.any()')
  })
})
