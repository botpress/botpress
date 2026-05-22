// This file is for testing various edge cases and issues with the zui to JSON Schema transformation.
// To be removed from the final codebase, but great for understanding.

import { z } from './packages/zui/src/index'
import { fromObject } from './packages/zui/src/transforms'

const zSchema = z.object({
  oop: z.string().describe('This is a string'),
  array: z.array(
    z.record(
      z.string(),
      z.object({
        record: z.record(
          z.string(),
          z.object({
            tuple: z.tuple([z.number(), z.number(), z.string(),
              z.object({
                nested: z.string().refine((v) => v.length > 0),
              })
            ])
          })
        )
      })
    )
  ),
})

const unionSchema = z.object({
  union: z.union([z.string(), z.number().refine((v) => v > 0)]),
})

const discriminatedUnionSchema = z.object({
  discriminatedUnion: z.discriminatedUnion('type', [
    z.object({ type: z.literal('a'), foo: z.string() }),
    z.object({ type: z.literal('b'), bar: z.number().refine((v) => v > 0) }),
  ]),
})

const intersectionSchema = z.object({
  intersection: z.intersection(
    z.object({ foo: z.string().refine((v) => v.length > 0) }),
    z.object({ bar: z.number() })
  ),
})

const setSchema = z.object({
  set: z.set(z.string().refine((v) => v.length > 0)),
})

const literalSchema = z.object({
  literal: z.literal(42n),
})

try {
  fromObject('not an object' as any)
} catch (e) {
  console.log((e as Error).message)
}

try {
  fromObject({
    a: {
      b: {
        c: [{ good: 'ok', broken: Symbol('x') }, { good: 'also ok' }],
      },
    },
  })
} catch (e) {
  console.log((e as Error).message)
}

const trimSchema = z.object({ field: z.string().trim() })

for (const schema of [zSchema, unionSchema, discriminatedUnionSchema, intersectionSchema, setSchema, literalSchema, trimSchema]) {
  try {
    schema.toJSONSchema()
  } catch (e) {
    console.log((e as Error).message)
  }
}
