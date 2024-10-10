import { describe, it, expect } from 'vitest'
import { toTypescript as toTs } from '.'
import z, { ZodType } from '../../z'
import * as errors from '../common/errors'

const toTypescript = (schema: ZodType): string => {
  const hasTitle = 'title' in schema.ui
  if (!hasTitle) {
    schema = schema.title('x')
  }
  return toTs(schema, { declaration: true })
}

describe.concurrent('functions', () => {
  it('title mandatory to declare', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .describe('Add two numbers together.\nThis is a multiline description')
    expect(() => toTs(fn, { declaration: true })).toThrowError(errors.ZuiToTypescriptTypeError)
  })

  it('type delcaration works', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .title('add')
      .describe('Add two numbers together.\nThis is a multiline description')

    const typings = toTs(fn, { declaration: 'type' })
    await expect(typings).toMatchWithoutFormatting(`
      /**
       * Add two numbers together.
       * This is a multiline description
       */
        type add = (arg0: { a: number; b: number }) => number;
      `)
  })

  it('function with multi-line description', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .title('add')
      .describe('Add two numbers together.\nThis is a multiline description')

    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting(`
      /**
       * Add two numbers together.
       * This is a multiline description
       */
      declare const add: (arg0: { a: number; b: number }) => number;
    `)
  })

  it('function with no args and unknown return', async () => {
    const fn = z.function().title('fn')

    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting('declare const fn: () => unknown;')
  })

  it('function with no args and void return', async () => {
    const fn = z.function().title('fn').returns(z.void())

    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting('declare const fn: () => void;')
  })

  it('async function returning union', async () => {
    const fn = z
      .function()
      .title('fn')
      .returns(z.promise(z.union([z.number(), z.string()])))

    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting('declare const fn: () => Promise<number | string>;')
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
        z.tuple([z.string(), z.number().describe('This is a number')]),
      )

    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting(`
      declare const fn: (
        arg0: {
          a?: number;
          /** This is B parameter */
          b: string
        },
        /** This is a number */
        arg1: number,
        arg2: [string, /** This is a number */ number]
      ) => unknown;
    `)
  })

  it('function with optional args', async () => {
    const fn = z.function().title('fn').args(z.string().optional())
    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting('declare const fn: (arg0?: string) => unknown;')
  })

  it('string literals', async () => {
    const typings = toTypescript(
      z
        .union([z.literal('Hello, world!'), z.literal('Yoyoyoyo')])
        .describe('yoyoyo\nmultiline')
        .title('x'),
    )
    await expect(typings).toMatchWithoutFormatting(`
      /**
       * yoyoyo
       * multiline
       */
      declare const x: 'Hello, world!' | 'Yoyoyoyo'
    `)
  })

  it('number literals', async () => {
    const code = toTypescript(z.literal(1).title('x'))
    await expect(code).toMatchWithoutFormatting('declare const x: 1')
  })

  it('boolean literals', async () => {
    const code = toTypescript(z.literal(true))
    await expect(code).toMatchWithoutFormatting('declare const x: true')
  })

  it('undefined literals', async () => {
    const typings = toTypescript(z.literal(undefined))
    await expect(typings).toMatchWithoutFormatting('declare const x: undefined')
  })

  it('null literals', async () => {
    const typings = toTypescript(z.literal(null))
    await expect(typings).toMatchWithoutFormatting('declare const x: null')
  })

  it('bigint literals', async () => {
    const n = BigInt(100)
    const fn = () => toTypescript(z.literal(n))
    expect(fn).toThrowError()
  })

  it('non explicitly discriminated union', async () => {
    const schema = z.union([
      z.object({ enabled: z.literal(true), foo: z.string() }),
      z.object({ enabled: z.literal(false), bar: z.number() }),
    ])
    const typings = toTypescript(schema)
    await expect(typings).toMatchWithoutFormatting(`declare const x: {
          enabled: true;
          foo: string
        } | {
          enabled: false;
          bar: number
        }
      `)
  })

  it('function with named args', async () => {
    const fn = z.function().title('fn').args(z.string().title('firstName').optional())
    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting('declare const fn: (firstName?: string) => unknown;')
  })

  it('mix of named and unnammed params', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().title('firstName').optional(), z.number(), z.object({ a: z.string() }).title('obj'))
    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting(`
        declare const fn: (
          firstName?: string,
          arg1: number,
          obj: { a: string }
        ) => unknown;
      `)
  })

  it('nullables and optionals combined', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().nullable().optional(), z.number().optional())
      .returns(z.string().nullable().optional())

    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting(`
      declare const fn: (
        arg0?: string | null,
        arg1?: number
      ) => string | null | undefined;
    `)
  })
})

describe.concurrent('objects', () => {
  it('title mandatory to declare', async () => {
    const obj = z.object({ a: z.number(), b: z.string() })
    expect(() => toTs(obj, { declaration: true })).toThrowError()
  })

  it('type declaration works', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject')

    const typings = toTs(obj, { declaration: 'type' })

    await expect(typings).toMatchWithoutFormatting('type MyObject = { a: number; b: string };')
  })

  it('normal object', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string };')
  })

  it('object with title and description', async () => {
    const obj = z
      .object({ a: z.number(), b: z.string() })
      .title('MyObject')
      .describe('This is my object.\nThis is a multiline description.\n\n\n')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        /**
         * This is my object.
         * This is a multiline description.
         */
        declare const MyObject: { a: number; b: string };
      `)
  })

  it('nullable', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').nullable()

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string } | null;')
  })

  it('optionals with default values', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').optional().default({ a: 1, b: 'hello' })

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string } | undefined;')
  })

  it('enum', async () => {
    const obj = z.object({ a: z.enum(['hello', 'world']) }).title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          a: 'hello' | 'world'
        };
      `)
  })

  it('object with a description & optional', async () => {
    const obj = z
      .object({
        someStr: z.string().describe('Description').optional(),
      })
      .title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          /** Description */
          someStr?: string
        };
      `)
  })

  it('object with optional and a description (opposite of previous test)', async () => {
    const obj = z
      .object({
        someStr: z.string().optional().describe('Description'),
      })
      .title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          /** Description */
          someStr?: string
        };
      `)
  })

  it('object with nullable object and no properties', async () => {
    const obj = z
      .object({
        address: z.object({}).nullable(),
      })
      .title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting('declare const MyObject: { address: {} | null };')
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
            }),
          )
          .describe('This is a record'),
      })
      .title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          /** This is a record */
          address: { [key: number]: { street: string; number: number } }
        };
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
            .optional(),
        ),
      })
      .title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(
      `
        declare const MyObject: {
          computed: { [key: string]: { status: string; error?: string } | undefined }
        };
      `,
    )
  })

  it('Can handle a complex discriminated union with descriptions', async () => {
    const obj = z
      .discriminatedUnion('type', [
        z.object({
          type: z.literal('Credit Card'),
          cardNumber: z
            .string()
            .title('Credit Card Number')
            .placeholder('1234 5678 9012 3456')
            .describe('This is the card number'),
          expirationDate: z
            .string()
            .title('Expiration Date')
            .placeholder('10/29')
            .describe('This is the expiration date'),
          brand: z
            .enum(['Visa', 'Mastercard', 'American Express'])
            .nullable()
            .optional()
            .default('Visa')
            .describe('This is the brand of the card'),
        }),
        z.object({
          type: z.literal('PayPal'),
          email: z
            .string()
            .email()
            .title('Paypal Email')
            .placeholder('john@doe.com')
            .describe("This is the paypal account's email address"),
        }),
        z.object({
          type: z.literal('Bitcoin'),
          address: z
            .string()
            .title('Bitcoin Address')
            .placeholder('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
            .describe('This is the bitcoin address'),
        }),
        z.object({
          type: z.literal('Bank Transfer'),
          accountNumber: z
            .string()
            .title('Account Number')
            .placeholder('1234567890')
            .describe('This is the bank account number'),
        }),
        z
          .object({
            type: z.literal('Cash'),
            amount: z
              .number()
              .title('Amount')
              .disabled((value) => (value || 0) > 100)
              .describe('This is the amount of cash'),
          })
          .disabled((obj) => {
            return {
              type: !!obj && obj.amount > 100,
            }
          })
          .disabled(() => {
            return false
          }),
      ])
      .title('payment')

    const typings = toTypescript(obj)

    expect(typings).toBeValidTypeScript() // TODO: change that to a proper `toMatchWithoutFormatting` check
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
              }),
            )
            .describe('This is a record'),
        ),
      })
      .title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          address: /** This is a record */ {
            [key: number]: { street: string; number: number }
          }
        };
      `)
  })

  it('array of complex object as input params', async () => {
    const fn = z
      .function()
      .args(z.array(z.object({ a: z.number(), b: z.string() })))
      .title('MyObject')
    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting(
      'declare const MyObject: (arg0: Array<{ a: number; b: string }>) => unknown;',
    )
  })

  it('array of primitives as input params', async () => {
    const fn = z.function().args(z.array(z.number()).describe('This is an array of numbers')).title('MyObject')
    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: (
          /** This is an array of numbers */
          arg0: number[]
        ) => unknown;
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

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          /** This is A */
          a: /** This is A */
          string
        };
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

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          'Hello World!': string;
          'Hey?'?: string;
          'Hey!'?: string
        };
      `)
  })

  it('chaining optionals only make properties optional once', async () => {
    const schema = z
      .object({
        foo: z.string().optional().optional(),
      })
      .partial()

    const typings = toTypescript(schema)
    const expected = `
        declare const x: {
          foo?: string
        }
      `
    await expect(typings).toMatchWithoutFormatting(expected)
  })

  it('chaining optional nullable should still be optional', async () => {
    const schema = z.object({
      foo: z.string().optional().nullable(),
    })

    const typings = toTypescript(schema)
    const expected = `
          declare const x: {
            foo?: string | undefined | null
          }
        `
    await expect(typings).toMatchWithoutFormatting(expected)
  })
})

describe.concurrent('generics', () => {
  it("can't generate a generic type without type declaration", async () => {
    const schema = z.object({ a: z.string(), b: z.ref('T') }).title('MyObject')
    expect(() => toTs(schema, { declaration: true })).toThrowError(errors.UnrepresentableGenericError)
    expect(() => toTs(schema, { declaration: false })).toThrowError(errors.UnrepresentableGenericError)
    expect(() => toTs(schema, { declaration: 'variable' })).toThrowError(errors.UnrepresentableGenericError)
    expect(() => toTs(schema, { declaration: 'none' })).toThrowError(errors.UnrepresentableGenericError)
  })

  it('can generate a generic type', async () => {
    const schema = z.object({ a: z.string(), b: z.ref('T') }).title('MyObject')
    const typings = toTs(schema, { declaration: 'type' })

    await expect(typings).toMatchWithoutFormatting('type MyObject<T> = { a: string; b: T };')
  })

  it('can generate a generic type by formating ref Uri', async () => {
    const schema = z.object({ a: z.string(), b: z.ref('#/$defs/T') }).title('MyObject')
    const typings = toTs(schema, { declaration: 'type' })

    await expect(typings).toMatchWithoutFormatting('type MyObject<DefsT> = { a: string; b: DefsT };')
  })
})
