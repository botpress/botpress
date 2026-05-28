// This file is for testing various edge cases and issues with the zui to JSON Schema transformation.
// To be removed from the final codebase, but great for understanding.

import { z as sdkZ } from './packages/sdk/src/zui'
import { z } from './packages/zui/src/index'
import {
  fromObject,
  fromJSONSchema,
  fromJSONSchemaLegacy,
  toTypescriptSchema,
  toTypescriptType,
} from './packages/zui/src/transforms'
import { toZuiPrimitive } from './packages/zui/src/transforms/zui-from-json-schema/primitives'
import { traverseZodDefinitions } from './packages/zui/src/transforms/zui-from-json-schema-legacy'

enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}

const zSchema = z.object({
  oop: z.string().describe('This is a string'),
  array: z.array(
    z.record(
      z.boolean(),
      z.object({
        record: z.record(
          z.string(),
          z.object({
            tuple: z.tuple([
              z.number(),
              z.number(),
              z.string(),
              z.object({
                nested: z.nativeEnum(Direction),
              }),
            ]),
          })
        ),
      })
    )
  ),
})

const unionSchema = z.object({
  union: z.union([z.string(), z.nativeEnum(Direction)]),
})

const discriminatedUnionSchema = z.object({
  discriminatedUnion: z.discriminatedUnion('type', [
    z.object({ type: z.literal('a'), foo: z.string() }),
    z.object({ type: z.literal('b'), bar: z.nativeEnum(Direction) }),
  ]),
})

const intersectionSchema = z.object({
  intersection: z.intersection(z.object({ foo: z.nativeEnum(Direction) }), z.object({ bar: z.number() })),
})

const setSchema = z.object({
  set: z.set(z.nativeEnum(Direction)),
})

const literalSchema = z.object({
  literal: z.nativeEnum(Direction),
})

const catchallSchema = z.object({
  name: z.string(),
  age: z.object({
    tuple: z.tuple([
      z.number(),
      z.number(),
      z.string(),
      z
        .object({
          nested: z.string(),
        })
        .catchall(z.nativeEnum(Direction)),
    ]),
  }),
})

const nativeEnumSchema = z.object({
  oop: z.string().describe('This is a string'),
  array: z.array(
    z.record(
      z.string(),
      z.object({
        record: z.record(
          z.string(),
          z.object({
            tuple: z.tuple([
              z.number(),
              z.number(),
              z.string(),
              z.object({
                direction: z.nativeEnum(Direction),
              }),
            ]),
          })
        ),
      })
    )
  ),
})

const recordSchema = z.object({
  record: z.record(z.string(), z.nativeEnum(Direction)),
})

const functionSchema = z.object({
  fn: z.function(z.tuple([z.string(), z.number()]), z.nativeEnum(Direction)),
})

const mapSchema = z.object({
  map: z.map(z.string(), z.nativeEnum(Direction)),
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

const trimSchema = z.object({ field: z.nativeEnum(Direction) })

// JSONSchemaToZuiError — type 'string' but schema.type is 'number', zuiPrimitive never gets set → line 56
try {
  toZuiPrimitive('string', { type: 'number' })
} catch (e) {
  console.log((e as Error).message)
}

console.log('--- traverseZodDefinitions with toJSONSchema ---')

for (const schema of [
  zSchema,
  unionSchema,
  discriminatedUnionSchema,
  intersectionSchema,
  setSchema,
  literalSchema,
  trimSchema,
  catchallSchema,
  recordSchema,
  functionSchema,
  mapSchema,
]) {
  try {
    schema.toJSONSchema()
    //console.log(`Successfully transformed schema: ${schema._def.description || 'no description'}`)
  } catch (e) {
    //console.log((e as Error).message)
  }
}

console.log('--- traverseZodDefinitions with toTypescriptSchema ---')

for (const schema of [
  zSchema,
  unionSchema,
  discriminatedUnionSchema,
  intersectionSchema,
  setSchema,
  literalSchema,
  trimSchema,
  catchallSchema,
  recordSchema,
  functionSchema,
  mapSchema,
]) {
  try {
    schema.toTypescriptSchema()
    //console.log(`Successfully transformed schema to TypeScript: ${schema._def.description || 'no description'}`)
  } catch (e) {
    //console.log((e as Error).message)
  }
}

console.log('--- traverseZodDefinitions with toTypescriptType ---')

for (const schema of [
  zSchema,
  unionSchema,
  discriminatedUnionSchema,
  intersectionSchema,
  setSchema,
  literalSchema,
  trimSchema,
  catchallSchema,
  recordSchema,
  functionSchema,
  mapSchema,
]) {
  try {
    schema.toTypescriptType()
    //console.log(`Successfully transformed schema to TypeScript type: ${schema._def.description || 'no description'}`)
  } catch (e) {
    //console.log((e as Error).message)
  }
}

// UnsupportedZuiToTypescriptTypeError — ZodNativeEnum is not supported in toTypescriptType
try {
  toTypescriptType(nativeEnumSchema)
} catch (e) {
  console.log((e as Error).message)
}

// UntitledDeclarationError — declaration mode requires a .title() on the schema
try {
  toTypescriptType(z.object({ name: z.string() }), { declaration: true })
} catch (e) {
  console.log((e as Error).message)
}

// --- fromJSONSchema loop ---

const jsonSchemaFlat = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    config: { if: { properties: { active: { type: 'boolean' } } }, then: { type: 'object' } },
  },
} as const

const jsonSchemaNestedObject = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      propertyNames: { pattern: '^[A-Za-z]+$' },
    },
    tags: { type: 'array', items: { type: 'string' } },
  },
} as const

const jsonSchemaTuple = {
  type: 'object',
  properties: {
    coords: {
      type: 'array',
      prefixItems: [{ type: 'number' }, { type: 'number' }, { not: { type: 'string' } }],
      items: false,
    },
  },
} as const

const jsonSchemaUnion = {
  type: 'object',
  properties: {
    value: { anyOf: [{ type: 'string' }, { type: 'number' }] },
    restricted: { else: { type: 'string' } },
  },
} as const

const jsonSchemaUnsupported = {
  type: 'object',
  properties: {
    inner: {
      type: 'object',
      patternProperties: { '^S_': { type: 'string' } },
    },
  },
} as const

for (const schema of [
  jsonSchemaFlat,
  jsonSchemaNestedObject,
  jsonSchemaTuple,
  jsonSchemaUnion,
  jsonSchemaUnsupported,
]) {
  try {
    fromJSONSchema(schema as any)
    console.log('Successfully transformed JSON schema')
  } catch (e) {
    console.log((e as Error).message)
  }
}

// UnsupportedJSONSchemaToZuiError — nested object with patternProperties is not supported
try {
  fromJSONSchema({
    type: 'object',
    properties: {
      inner: {
        type: 'object',
        patternProperties: { '^S_': { type: 'string' } },
      },
    },
  })
} catch (e) {
  console.log((e as Error).message)
}

// additionalItemsOf prefix — rest element of tuple fails, path should show "additionalItemsOf #.data"
try {
  z.object({
    data: z.tuple([z.string(), z.number()]).rest(z.string().refine((v) => v.length > 0)),
  }).toJSONSchema()
} catch (e) {
  console.log((e as Error).message)
}
