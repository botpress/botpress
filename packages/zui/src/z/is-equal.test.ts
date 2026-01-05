import { describe, test, expect } from 'vitest'
import { z } from './index'

const expectZui = (actual: z.Schema) => ({
  not: {
    toEqual: (expected: z.Schema) => {
      const result = actual.isEqual(expected)
      expect(result).toBe(false)
    },
  },
  toEqual: (expected: z.Schema) => {
    const result = actual.isEqual(expected)
    expect(result).toBe(true)
  },
})

describe('isEqual', () => {
  test('any', () => {
    expectZui(z.any()).toEqual(z.any())
  })
  test('array', () => {
    expectZui(z.array(z.string())).toEqual(z.array(z.string()))
  })
  test('bigint', () => {
    expectZui(z.bigint()).toEqual(z.bigint())
    const min = BigInt(1)
    const max = BigInt(100)
    expectZui(z.bigint().min(min).max(max)).toEqual(z.bigint().max(max).min(min))
  })
  test('boolean', () => {
    expectZui(z.boolean()).toEqual(z.boolean())
  })
  test('branded', () => {
    expectZui(z.string().brand()).toEqual(z.string().brand())
  })
  test('catch', () => {
    expectZui(z.string().catch('hello')).toEqual(z.string().catch('hello'))
  })
  test('custom', () => {
    expectZui(z.custom()).toEqual(z.custom())
  })
  test('date', () => {
    expectZui(z.date()).toEqual(z.date())

    const MS_PER_DAY = 24 * 60 * 60 * 1000
    const now: number = Date.now()
    const today = (): Date => new Date(now)
    const yesterday = (): Date => new Date(now - MS_PER_DAY)
    const tomorrow = (): Date => new Date(now + MS_PER_DAY)

    expectZui(
      //
      z.date().min(today()).min(yesterday()),
    ).toEqual(
      //
      z.date().min(yesterday()).min(today()),
    )

    expectZui(
      //
      z.date().max(today()).max(tomorrow()),
    ).toEqual(
      //
      z.date().max(tomorrow()).max(today()),
    )

    expectZui(
      //
      z.date().min(yesterday()).max(tomorrow()),
    ).toEqual(
      //
      z.date().max(tomorrow()).min(yesterday()),
    )
  })
  test('default', () => {
    expectZui(z.string().default('hello')).toEqual(z.string().default('hello'))
  })
  test('discriminatedUnion', () => {
    expectZui(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), a: z.string() }),
        z.object({ type: z.literal('b'), b: z.string() }),
      ]),
    ).toEqual(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('b'), b: z.string() }),
        z.object({ type: z.literal('a'), a: z.string() }),
      ]),
    )
  })
  test('enum', () => {
    expectZui(z.enum(['a', 'b', 'c'])).toEqual(z.enum(['b', 'a', 'c']))
  })

  test('function', () => {
    expectZui(
      //
      z.function().args(z.string()).returns(z.number()),
    ).toEqual(
      //
      z.function().args(z.string()).returns(z.number()),
    )
  })
  test('intersection', () => {
    expectZui(
      //
      z.intersection(
        //
        z.object({ a: z.string() }),
        z.object({ b: z.number() }),
      ),
    ).toEqual(
      //
      //
      z.intersection(
        //
        z.object({ b: z.number() }),
        z.object({ a: z.string() }),
      ),
    )
  })
  test('lazy', () => {
    expectZui(z.lazy(() => z.string())).toEqual(z.lazy(() => z.string()))
  })
  test('literal', () => {
    expectZui(z.literal('banana')).toEqual(z.literal('banana'))
  })
  test('map', () => {
    expectZui(
      //
      z.map(z.string(), z.object({ foo: z.boolean() })),
    ).toEqual(
      //
      z.map(z.string(), z.object({ foo: z.boolean() })),
    )
  })
  test('nan', () => {
    expectZui(z.nan()).toEqual(z.nan())
  })
  test('nativeEnum', () => {
    enum FruitA {
      Apple = 'apple',
      Banana = 'banana',
      Orange = 'orange',
    }

    enum FruitB {
      Orange = 'orange',
      Banana = 'banana',
      Apple = 'apple',
    }

    expectZui(z.nativeEnum(FruitA)).toEqual(z.nativeEnum(FruitB))
  })
  test('never', () => {
    expectZui(z.never()).toEqual(z.never())
  })
  test('null', () => {
    expectZui(z.null()).toEqual(z.null())
  })
  test('nullable', () => {
    expectZui(z.string().nullable()).toEqual(z.nullable(z.string()))
  })
  test('number', () => {
    expectZui(z.number()).toEqual(z.number())
    expectZui(z.number().int().nonnegative()).toEqual(z.number().nonnegative().int())
  })
  test('object', () => {
    expectZui(
      z.object({
        a: z.string(),
        b: z.number(),
      }),
    ).toEqual(
      z.object({
        b: z.number(),
        a: z.string(),
      }),
    )
  })
  test('strict object', () => {
    expectZui(
      z
        .object({
          a: z.string(),
          b: z.number(),
        })
        .strict(),
    ).toEqual(
      z
        .object({
          b: z.number(),
          a: z.string(),
        })
        .catchall(z.never()),
    )
  })
  test('passthrough object', () => {
    expectZui(
      z
        .object({
          a: z.string(),
          b: z.number(),
        })
        .passthrough(),
    ).toEqual(
      z
        .object({
          b: z.number(),
          a: z.string(),
        })
        .catchall(z.any()),
    )
  })
  test('optional', () => {
    expectZui(z.string().optional()).toEqual(z.optional(z.string()))
  })
  test('pipeline', () => {
    expectZui(
      //
      z.pipeline(z.string(), z.number()),
    ).toEqual(
      //
      z.pipeline(z.string(), z.number()),
    )
  })
  test('promise', () => {
    expectZui(
      //
      z.promise(z.string()),
    ).toEqual(
      //
      z.string().promise(),
    )
  })
  test('readonly', () => {
    expectZui(z.readonly(z.string())).toEqual(z.readonly(z.string()))
  })
  test('record', () => {
    expectZui(
      //
      z.record(z.string(), z.boolean()),
    ).toEqual(
      //
      z.record(z.string(), z.boolean()),
    )
  })
  test('ref', () => {
    expectZui(z.ref('#lol')).toEqual(z.ref('#lol'))
  })
  test('set', () => {
    expectZui(
      //
      z.set(z.string()),
    ).toEqual(
      //
      z.set(z.string()),
    )
  })
  test('string', () => {
    expectZui(z.string()).toEqual(z.string())
    expectZui(z.string().email().max(255)).toEqual(z.string().max(255).email())
  })
  test('symbol', () => {
    expectZui(z.symbol()).toEqual(z.symbol())
  })
  test('transformer', () => {
    expectZui(
      //
      z.string().transform((s) => s.toUpperCase()),
    ).toEqual(
      //
      z.string().transform((s) => s.toUpperCase()),
    )

    expectZui(
      //
      z.string().refine((s: string) => s === s.toUpperCase(), 'string must be upper case'),
    ).toEqual(
      //
      z.string().refine((s: string) => s === s.toUpperCase(), 'string is not upper case'),
    )
  })
  test('tuple', () => {
    expectZui(z.tuple([z.string(), z.number()])).toEqual(z.tuple([z.string(), z.number()]))
  })
  test('undefined', () => {
    expectZui(z.undefined()).toEqual(z.undefined())
  })
  test('union', () => {
    expectZui(
      //
      z.union([z.string(), z.number()]),
    ).toEqual(
      //
      z.union([z.number(), z.string()]),
    )
  })
  test('unknown', () => {
    expectZui(z.unknown()).toEqual(z.unknown())
  })
  test('void', () => {
    expectZui(z.void()).toEqual(z.void())
  })
})

describe('isNotEqual', () => {
  test('array', () => {
    expectZui(z.array(z.string())).not.toEqual(z.array(z.string()).max(10))
  })
  test('bigint', () => {
    const min1 = BigInt(1)
    const min2 = BigInt(2)
    expectZui(z.bigint().min(min1)).not.toEqual(z.bigint().min(min2))
  })

  test('object with different catchall', () => {
    expectZui(
      z
        .object({
          a: z.string(),
          b: z.number(),
        })
        .catchall(z.string()),
    ).not.toEqual(
      z
        .object({
          a: z.string(),
          b: z.number(),
        })
        .catchall(z.number()),
    )
  })
})
