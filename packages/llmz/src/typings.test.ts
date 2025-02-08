import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'

import { getTypings } from './typings.js'

describe('functions', () => {
  it('title mandatory to declare', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .describe('Add two numbers together.\nThis is a multiline description')

    await expect(getTypings(fn, { declaration: true })).rejects.toThrow(/title/i)
  })

  it('function with multi-line description', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .title('add')
      .describe('Add two numbers together.\nThis is a multiline description')

    const typings = await getTypings(fn, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "/**
       * Add two numbers together.
       * This is a multiline description
       */
      declare function add(arg0: { a: number; b: number }): number"
    `)
  })

  it('function with no args and unknown return', async () => {
    const fn = z.function().title('fn')

    const typings = await getTypings(fn, { declaration: true })

    expect(typings).toMatchInlineSnapshot('"declare function fn(): unknown"')
  })

  it('function with no args and void return', async () => {
    const fn = z.function().title('fn').returns(z.void())

    const typings = await getTypings(fn, { declaration: true })

    expect(typings).toMatchInlineSnapshot('"declare function fn(): void"')
  })

  it('async function returning union', async () => {
    const fn = z
      .function()
      .title('fn')
      .returns(z.promise(z.union([z.number(), z.string()])))

    const typings = await getTypings(fn, { declaration: true })

    expect(typings).toMatchInlineSnapshot('"declare function fn(): Promise<number | string>"')
  })

  it('function with multiple args', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(
        // Arg 1
        z.object({ a: z.number().optional(), b: z.string().title('B').describe('This is B parameter') }),
        // Arg 2
        z.number().describe('This is a number'),
        // Arg 3
        z.tuple([z.string(), z.number().describe('This is a number')])
      )

    const typings = await getTypings(fn, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "declare function fn(
        arg0: {
          a?: number
          /** This is B parameter */
          b: string
        },
        /** This is a number */
        arg1: number,
        arg2: [string, /** This is a number */ number],
      ): unknown // end of fn"
    `)
  })

  it('function with optional args', async () => {
    const fn = z.function().title('fn').args(z.string().optional())
    const typings = await getTypings(fn, { declaration: true })
    expect(typings).toMatchInlineSnapshot('"declare function fn(arg0?: string): unknown"')
  })

  it('string literals', async () => {
    const typings = await getTypings(
      z.union([z.literal('Hello, world!'), z.literal('Yoyoyoyo')]).describe('yoyoyo\nmultiline')
    )
    expect(typings).toMatchInlineSnapshot(`
      "/**
       * yoyoyo
       * multiline
       */
      "Hello, world!" | "Yoyoyoyo""
    `)
  })

  it('function with named args', async () => {
    const fn = z.function().title('fn').args(z.string().title('firstName').optional())
    const typings = await getTypings(fn, { declaration: true })
    expect(typings).toMatchInlineSnapshot('"declare function fn(firstName?: string): unknown"')
  })

  it('mix of named and unnammed params', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().title('firstName').optional(), z.number(), z.object({ a: z.string() }).title('obj'))
    const typings = await getTypings(fn, { declaration: true })
    expect(typings).toMatchInlineSnapshot(`
      "declare function fn(
        firstName?: string,
        arg1: number,
        obj: { a: string },
      ): unknown"
    `)
  })

  it('nullables and optionals combined', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().nullable().optional(), z.number().optional())
      .returns(z.string().nullable().optional())

    const typings = await getTypings(fn, { declaration: true })
    expect(typings).toMatchInlineSnapshot(`
      "declare function fn(
        arg0?: string | null,
        arg1?: number,
      ): string | null | undefined"
    `)
  })
})

describe('objects', () => {
  it('title mandatory to declare', async () => {
    const obj = z.object({ a: z.number(), b: z.string() })
    await expect(getTypings(obj, { declaration: true })).rejects.toThrow(/title/i)
  })

  it('normal object', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot('"declare const MyObject: { a: number; b: string }"')
  })

  it('object with title and description', async () => {
    const obj = z
      .object({ a: z.number(), b: z.string() })
      .title('MyObject')
      .describe('This is my object.\nThis is a multiline description.\n\n\n')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "/**
       * This is my object.
       * This is a multiline description.
       */
      declare const MyObject: { a: number; b: string }"
    `)
  })

  it('object with a function property that has object args', async () => {
    const obj = z
      .object({
        a: z.number(),
        b: z.string(),
        c: z.function().args(
          z.object({
            d: z.string().describe('This is d'),
            e: z
              .object({
                f: z.boolean().optional().default(true).describe('This is f'),
                g: z.enum(['ga', 'gb']).default('ga').describe('This is g'),
                h: z.array(z.string()).default([]).describe('This is h'),
              })
              .describe('The Knowledge Bases to Query'),
          })
        ),
      })
      .title('MyObject')
      .describe('This is my object.\nThis is a multiline description.\n\n\n')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "/**
       * This is my object.
       * This is a multiline description.
       */
      declare const MyObject: {
        a: number
        b: string
        c: (arg0: {
          /** This is d */
          d: string
          /** The Knowledge Bases to Query */
          e: {
            /** This is f */
            f: boolean | undefined
            /** This is g */
            g: "ga" | "gb"
            /** This is h */
            h: string[]
          }
        }) => unknown
      } // end of MyObject"
    `)
  })

  it('nullable', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').nullable()

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot('"declare const MyObject: { a: number; b: string } | null"')
  })

  it('optionals with default values', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').optional().default({ a: 1, b: 'hello' })

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot('"declare const MyObject: { a: number; b: string } | undefined"')
  })

  it('enum', async () => {
    const obj = z.object({ a: z.enum(['hello', 'world']) }).title('MyObject')

    const typings = await getTypings(obj)

    expect(typings).toMatchInlineSnapshot(`
      "{
        a: "hello" | "world"
      }"
    `)
  })

  it('object with a description & optional', async () => {
    const obj = z
      .object({
        someStr: z.string().describe('Description').optional(),
      })
      .title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "declare const MyObject: {
        /** Description */
        someStr?: string
      }"
    `)
  })

  it('object with optional and a description (opposite of previous test)', async () => {
    const obj = z
      .object({
        someStr: z.string().optional().describe('Description'),
      })
      .title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "declare const MyObject: {
        /** Description */
        someStr?: string
      }"
    `)
  })

  it('object with nullable object and no properties', async () => {
    const obj = z
      .object({
        address: z.object({}).nullable(),
      })
      .title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot('"declare const MyObject: { address: {} | null }"')
  })

  it('zod record', async () => {
    const obj = z
      .object({
        address: z
          .record(
            z.number(),
            z.object({
              street: z.string(),
              number: z.number(),
            })
          )
          .describe('This is a record'),
      })
      .title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "declare const MyObject: {
        /** This is a record */
        address: { [key: number]: { street: string; number: number } }
      }"
    `)
  })

  it('zod record with an optional object', async () => {
    const obj = z
      .object({
        computed: z.record(
          z.string(),
          z
            .object({
              status: z.string(),
              error: z.string().optional(),
            })
            .optional()
        ),
      })
      .title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    //'?' at the end of a type is not valid TypeScript syntax. Did you mean to write '{ status: string; error?: string | undefined; } | undefined'?
    expect(typings).toMatchInlineSnapshot(
      `
      "declare const MyObject: {
        computed: { [key: string]: { status: string; error?: string } | undefined }
      }"
    `
    )
  })

  it('zod lazy', async () => {
    const obj = z
      .object({
        address: z.lazy(() =>
          z
            .record(
              z.number(),
              z.object({
                street: z.string(),
                number: z.number(),
              })
            )
            .describe('This is a record')
        ),
      })
      .title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "declare const MyObject: {
        address: /** This is a record */ {
          [key: number]: { street: string; number: number }
        }
      }"
    `)
  })

  it('array of complex object as input params', async () => {
    const fn = z
      .function()
      .args(z.array(z.object({ a: z.number(), b: z.string() })))
      .title('MyObject')
    const typings = await getTypings(fn, { declaration: true })

    expect(typings).toMatchInlineSnapshot('"declare function MyObject(arg0: Array<{ a: number; b: string }>): unknown"')
  })

  it('array of primitives as input params', async () => {
    const fn = z.function().args(z.array(z.number()).describe('This is an array of numbers')).title('MyObject')
    const typings = await getTypings(fn, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "declare function MyObject(
        /** This is an array of numbers */
        arg0: number[],
      ): unknown // end of MyObject"
    `)
  })

  it('zod effects', async () => {
    const obj = z
      .object({
        a: z
          .string()
          .title('A')
          .describe('This is A')
          .transform((val) => val.toUpperCase()),
      })
      .title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "declare const MyObject: {
        /** This is A */
        a: /** This is A */ string
      }"
    `)
  })

  it('zod effects', async () => {
    const obj = z
      .object({
        'Hello World!': z.string(),
        'Hey?': z.string().optional(),
        'Hey!': z.string().optional(),
      })
      .title('MyObject')

    const typings = await getTypings(obj, { declaration: true })

    expect(typings).toMatchInlineSnapshot(`
      "declare const MyObject: {
        "Hello World!": string
        "Hey?"?: string
        "Hey!"?: string
      }"
    `)
  })

  it('literals', async () => {
    const obj = z
      .object({
        stringLiteral: z.literal('1'),
        numberLiteral: z.literal(1),
        booleanLiteral: z.literal(true),
        arrayLiteral: z.array(z.literal('a')),
        tupleLiteral: z.tuple([z.literal('a'), z.literal(1)]),
        emptyTyple: z.tuple([]),
        nested: z.object({
          nestedLiteral: z.literal('nested'),
        }),
      })
      .title('MyObject')

    const typings = await getTypings(obj)

    expect(typings).toMatchInlineSnapshot(`
      "{
        stringLiteral: "1"
        numberLiteral: 1
        booleanLiteral: true
        arrayLiteral: Array<"a">
        tupleLiteral: ["a", 1]
        emptyTyple: []
        nested: {
          nestedLiteral: "nested"
        }
      }"
    `)
  })

  it('unions as fn args', async () => {
    const fn1 = z
      .function()
      .args(z.union([z.number(), z.string()]))
      .returns(z.union([z.number(), z.string()]))
      .title('fn1')

    const fn2 = z
      .function()
      .args(z.union([z.object({ id: z.array(z.number()) }), z.string()]))
      .title('fn2')

    const fn3 = z
      .function()
      .args(z.union([z.object({ id: z.array(z.number()) }), z.object({ name: z.string() })]))
      .title('fn3')

    const typings1 = await getTypings(fn1, { declaration: true })
    const typings2 = await getTypings(fn2, { declaration: true })
    const typings3 = await getTypings(fn3, { declaration: true })

    expect(typings1).toMatchInlineSnapshot(`"declare function fn1(arg0: number | string): number | string"`)
    expect(typings2).toMatchInlineSnapshot(`"declare function fn2(arg0: { id: number[] } | string): unknown"`)
    expect(typings3).toMatchInlineSnapshot(`"declare function fn3(arg0: { id: number[] } | { name: string }): unknown"`)
  })

  it('records', async () => {
    const obj = z
      .object({
        Date: z.string().describe('Test\nHello').describe('Test2'),
        'Hello World!': z.string().optional(),
      })
      .required({ Date: true })

    const typings = await getTypings(obj)
    expect(typings).toMatchInlineSnapshot(`
      "{ 
      /** Test2 */
      Date: string
      ; 'Hello World!'?: string }"
    `)
  })

  it('double optional', async () => {
    const obj = z
      .object({
        Date: z.optional(z.string().optional().optional()),
      })
      .required({ Date: false } as any)

    const typings = await getTypings(obj)
    expect(typings).toMatchInlineSnapshot(`"{ Date?: string }"`)
  })
})

// TODO: regex, discriminated unions, literals, arrays, never, NaN, z.catch(), z.transform(), z.effects()
