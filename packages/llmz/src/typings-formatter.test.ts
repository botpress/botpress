import { z } from '@bpinternal/zui'
import { describe, expect, it, vi } from 'vitest'

import { formatTypings } from './typings-formatter.js'

// getTypings() normally pipes its output through ./formatting.js. We mock it
// to identity so the tests below exercise the RAW generator output, which is
// exactly what our minimal formatter receives.
vi.mock('./formatting.js', () => ({
  formatTypings: async (code: string) => code,
}))

import { getTypings } from './typings.js'

const gen = async (schema: z.Schema, options?: { declaration?: boolean }) =>
  formatTypings(await getTypings(schema, options))

describe('primitives and simple types', () => {
  it('primitive string', async () => {
    expect(await gen(z.string())).toMatchInlineSnapshot(`"string"`)
  })

  it('primitive with description', async () => {
    expect(await gen(z.number().describe('Age of the user'))).toMatchInlineSnapshot(`
      "/** Age of the user */
      number"
    `)
  })

  it('enum (short union stays on one line)', async () => {
    expect(await gen(z.enum(['draft', 'published', 'archived']))).toMatchInlineSnapshot(
      `"'draft' | 'published' | 'archived'"`
    )
  })

  it('long literal union wraps', async () => {
    expect(
      await gen(
        z.enum([
          'first-really-long-option',
          'second-really-long-option',
          'third-really-long-option',
          'fourth-really-long-option',
          'fifth-really-long-option',
        ])
      )
    ).toMatchInlineSnapshot(`
      "| 'first-really-long-option'
      | 'second-really-long-option'
      | 'third-really-long-option'
      | 'fourth-really-long-option'
      | 'fifth-really-long-option'"
    `)
  })

  it('union with multiline description', async () => {
    expect(await gen(z.union([z.literal('Hello, world!'), z.literal('Yoyoyoyo')]).describe('yoyoyo\nmultiline')))
      .toMatchInlineSnapshot(`
      "/**
       * yoyoyo
       * multiline
       */
      'Hello, world!' | 'Yoyoyoyo'"
    `)
  })
})

describe('objects', () => {
  it('small object stays inline', async () => {
    expect(await gen(z.object({ a: z.number(), b: z.string() }))).toMatchInlineSnapshot(`"{ a: number; b: string }"`)
  })

  it('empty object', async () => {
    expect(await gen(z.object({}))).toMatchInlineSnapshot(`"{}"`)
  })

  it('wide object breaks onto multiple lines', async () => {
    expect(
      await gen(
        z.object({
          firstName: z.string(),
          lastName: z.string(),
          emailAddress: z.string(),
          phoneNumber: z.string().optional(),
          shippingAddress: z.string(),
        })
      )
    ).toMatchInlineSnapshot(`
      "{
        firstName: string
        lastName: string
        emailAddress: string
        phoneNumber?: string
        shippingAddress: string
      }"
    `)
  })

  it('property descriptions force multiline with comments', async () => {
    expect(
      await gen(
        z.object({
          id: z.string().describe('Unique identifier'),
          count: z.number().optional().describe('How many items'),
        })
      )
    ).toMatchInlineSnapshot(`
      "{
        /** Unique identifier */
        id: string
        /** How many items */
        count?: number
      }"
    `)
  })

  it('nested objects', async () => {
    expect(
      await gen(
        z.object({
          user: z.object({
            name: z.string(),
            address: z.object({
              street: z.string(),
              city: z.string(),
              country: z.enum(['CA', 'US']),
            }),
          }),
        })
      )
    ).toMatchInlineSnapshot(`
      "{
        user: {
          name: string
          address: { street: string; city: string; country: 'CA' | 'US' }
        }
      }"
    `)
  })

  it('quoted and exotic keys', async () => {
    expect(
      await gen(
        z.object({
          'Hello World!': z.string(),
          'Hey?': z.string().optional(),
          normal_key: z.boolean(),
        })
      )
    ).toMatchInlineSnapshot(`"{ 'Hello World!': string; 'Hey?'?: string; normal_key: boolean }"`)
  })

  it('literals of all kinds', async () => {
    expect(
      await gen(
        z.object({
          stringLiteral: z.literal('1'),
          numberLiteral: z.literal(1),
          booleanLiteral: z.literal(true),
          arrayLiteral: z.array(z.literal('a')),
          tupleLiteral: z.tuple([z.literal('a'), z.literal(1)]),
          emptyTuple: z.tuple([]),
          nested: z.object({ nestedLiteral: z.literal('nested') }),
        })
      )
    ).toMatchInlineSnapshot(`
      "{
        stringLiteral: '1'
        numberLiteral: 1
        booleanLiteral: true
        arrayLiteral: Array<'a'>
        tupleLiteral: ['a', 1]
        emptyTuple: []
        nested: { nestedLiteral: 'nested' }
      }"
    `)
  })

  it('arrays of primitives and of objects', async () => {
    expect(
      await gen(
        z.object({
          tags: z.array(z.string()),
          users: z.array(z.object({ id: z.string(), name: z.string() })),
        })
      )
    ).toMatchInlineSnapshot(`"{ tags: string[]; users: Array<{ id: string; name: string }> }"`)
  })

  it('records', async () => {
    expect(
      await gen(
        z.object({
          byId: z.record(z.string(), z.object({ status: z.string(), error: z.string().optional() }).optional()),
        })
      )
    ).toMatchInlineSnapshot(`"{ byId: { [key: string]: { status: string; error?: string } | undefined } }"`)
  })

  it('nullable and optional combinations', async () => {
    expect(
      await gen(
        z.object({
          a: z.string().nullable(),
          b: z.string().nullable().optional(),
          c: z.object({ d: z.number() }).nullable(),
        })
      )
    ).toMatchInlineSnapshot(`"{ a: string | null; b?: string | null; c: { d: number } | null }"`)
  })
})

describe('declarations', () => {
  it('declare const, short body stays inline', async () => {
    expect(
      await gen(z.object({ a: z.number(), b: z.string() }).title('MyObject'), { declaration: true })
    ).toMatchInlineSnapshot(`"declare const MyObject: { a: number; b: string }"`)
  })

  it('declare const with description', async () => {
    expect(
      await gen(
        z
          .object({ a: z.number(), b: z.string() })
          .title('MyObject')
          .describe('This is my object.\nThis is a multiline description.'),
        { declaration: true }
      )
    ).toMatchInlineSnapshot(`
      "/**
       * This is my object.
       * This is a multiline description.
       */
      declare const MyObject: { a: number; b: string }"
    `)
  })

  it('declare const nullable', async () => {
    expect(
      await gen(z.object({ a: z.number() }).title('MyObject').nullable(), { declaration: true })
    ).toMatchInlineSnapshot(`"declare const MyObject: { a: number } | null"`)
  })

  it('declare function, no args, void return', async () => {
    expect(await gen(z.function().title('fn').returns(z.void()), { declaration: true })).toMatchInlineSnapshot(
      `"declare function fn(): void"`
    )
  })

  it('declare function with object arg', async () => {
    expect(
      await gen(
        z
          .function()
          .args(z.object({ a: z.number(), b: z.number() }))
          .returns(z.number())
          .title('add')
          .describe('Add two numbers together.\nThis is a multiline description'),
        { declaration: true }
      )
    ).toMatchInlineSnapshot(`
      "/**
       * Add two numbers together.
       * This is a multiline description
       */
      declare function add(arg0: { a: number; b: number }): number"
    `)
  })

  it('async function returning union', async () => {
    expect(
      await gen(
        z
          .function()
          .title('fn')
          .returns(z.promise(z.union([z.number(), z.string()]))),
        { declaration: true }
      )
    ).toMatchInlineSnapshot(`"declare function fn(): Promise<number | string>"`)
  })

  it('function with multiple args incl. tuple and descriptions', async () => {
    expect(
      await gen(
        z
          .function()
          .title('fn')
          .args(
            z.object({ a: z.number().optional(), b: z.string().title('B').describe('This is B parameter') }),
            z.number().describe('This is a number'),
            z.tuple([z.string(), z.number().describe('This is a number')])
          ),
        { declaration: true }
      )
    ).toMatchInlineSnapshot(`
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

  it('function with optional named arg', async () => {
    expect(
      await gen(z.function().title('fn').args(z.string().title('firstName').optional()), { declaration: true })
    ).toMatchInlineSnapshot(`"declare function fn(firstName?: string): unknown"`)
  })

  it('function args spanning multiple lines', async () => {
    expect(
      await gen(
        z
          .function()
          .title('fn')
          .args(z.string().title('firstName').optional(), z.number(), z.object({ a: z.string() }).title('obj')),
        { declaration: true }
      )
    ).toMatchInlineSnapshot(`
      "declare function fn(
        firstName?: string,
        arg1: number,
        obj: { a: string },
      ): unknown"
    `)
  })
})

describe('complex real-world shapes', () => {
  it('object with a function property that has nested object args', async () => {
    expect(
      await gen(
        z
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
          .describe('This is my object.\nThis is a multiline description.'),
        { declaration: true }
      )
    ).toMatchInlineSnapshot(`
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
            f?: boolean
            /** This is g */
            g?: 'ga' | 'gb'
            /** This is h */
            h?: string[]
          }
        }) => unknown
      } // end of MyObject"
    `)
  })

  it('kitchen sink: unions of objects, records, arrays, weird keys', async () => {
    expect(
      await gen(
        z
          .object({
            kind: z.enum(['user', 'bot', 'system']).describe('Type of the author'),
            payload: z.union([
              z.object({ type: z.literal('text'), text: z.string().describe('The message text') }),
              z.object({
                type: z.literal('choice'),
                options: z.array(z.object({ label: z.string(), value: z.string() })),
              }),
              z.object({ type: z.literal('image'), url: z.string(), caption: z.string().optional() }),
            ]),
            metadata: z.record(z.string(), z.unknown()).describe('Arbitrary metadata'),
            'x-custom-header': z.string().optional(),
            attachments: z
              .array(z.object({ id: z.string(), mimeType: z.string(), sizeBytes: z.number() }))
              .describe('Files attached to the message'),
          })
          .title('Message')
          .describe('A message exchanged in a conversation'),
        { declaration: true }
      )
    ).toMatchInlineSnapshot(`
      "/** A message exchanged in a conversation */
      declare const Message: {
        /** Type of the author */
        kind: 'user' | 'bot' | 'system'
        payload:
          | {
              type: 'text'
              /** The message text */
              text: string
            }
          | { type: 'choice'; options: Array<{ label: string; value: string }> }
          | { type: 'image'; url: string; caption?: string }
        /** Arbitrary metadata */
        metadata: { [key: string]: unknown }
        'x-custom-header'?: string
        /** Files attached to the message */
        attachments: Array<{ id: string; mimeType: string; sizeBytes: number }>
      } // end of Message"
    `)
  })
})

describe('namespaces (objects.ts output shape)', () => {
  it('namespace with banner comments, properties and tools', () => {
    const raw = [
      '/**',
      ' * User management tools',
      ' */',
      'export namespace Users {',
      '',
      '// ---------------- //',
      '//    Properties    //',
      '// ---------------- //',
      '',
      '/** The current user id */',
      "const currentUserId: Readonly<string> = 'usr_123'",
      "const preferences: Writable<{ theme: string; language: string }> = { theme: 'dark', language: 'en' }",
      '',
      '// ---------------- //',
      '//       Tools      //',
      '// ---------------- //',
      '',
      '/** List all users */',
      'function listUsers(args: { limit?: number }): Promise<Array<{ id: string; name: string; email: string }>>;// end of listUsers',
      'function deleteUser(args: { id: string }): Promise<void>;',
      '} // end namespace "Users"',
    ].join('\n')

    expect(formatTypings(raw)).toMatchInlineSnapshot(`
      "/**
       * User management tools
       */
      export namespace Users {
        // ---------------- //
        //    Properties    //
        // ---------------- //

        /** The current user id */
        const currentUserId: Readonly<string> = 'usr_123'
        const preferences: Writable<{ theme: string; language: string }> = {
          theme: 'dark',
          language: 'en'
        }

        // ---------------- //
        //       Tools      //
        // ---------------- //

        /** List all users */
        function listUsers(args: {
          limit?: number
        }): Promise<Array<{ id: string; name: string; email: string }>> // end of listUsers
        function deleteUser(args: { id: string }): Promise<void>
      } // end namespace "Users""
    `)
  })

  it('hoisted type aliases (hoist.ts output shape)', () => {
    const raw = [
      'type Client = { id: string; name: string; email: string; createdAt: string }',
      'declare function getClient(args: { id: string }): Promise<Client>;',
      'declare function listClients(args: { limit?: number; cursor?: string }): Promise<{ items: Array<Client>; nextCursor?: string }>;',
    ].join('\n')

    expect(formatTypings(raw)).toMatchInlineSnapshot(`
      "type Client = { id: string; name: string; email: string; createdAt: string }
      declare function getClient(args: { id: string }): Promise<Client>
      declare function listClients(args: {
        limit?: number
        cursor?: string
      }): Promise<{ items: Array<Client>; nextCursor?: string }>"
    `)
  })
})

describe('robustness', () => {
  it('is idempotent', async () => {
    const once = await gen(
      z
        .object({
          kind: z.enum(['user', 'bot', 'system']),
          payload: z.union([
            z.object({ type: z.literal('text'), text: z.string() }),
            z.object({ type: z.literal('image'), url: z.string() }),
          ]),
          attachments: z.array(z.object({ id: z.string(), mimeType: z.string() })).describe('Attached files'),
        })
        .title('Message'),
      { declaration: true }
    )

    expect(formatTypings(once)).toBe(once)
  })

  it('strings containing structural characters are untouched', async () => {
    expect(
      await gen(
        z.object({
          weird: z.literal('contains { braces; } and | pipes, (parens) and: colons'),
          quoted: z.literal('it\'s got "quotes"'),
        })
      )
    ).toMatchInlineSnapshot(`
      "{
        weird: 'contains { braces; } and | pipes, (parens) and: colons'
        quoted: "it\\'s got \\"quotes\\""
      }"
    `)
  })

  it('returns unbalanced input unchanged', () => {
    const broken = 'declare const X: { a: string'
    expect(formatTypings(broken)).toBe(broken)
  })

  it('returns empty input unchanged', () => {
    expect(formatTypings('')).toBe('')
    expect(formatTypings('   \n  ')).toBe('')
  })
})
