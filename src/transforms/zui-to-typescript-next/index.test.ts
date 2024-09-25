import { describe, it, expect } from 'vitest'
import { UntitledDeclarationError, toTypescript } from '.'
import z from '../../z'

describe.concurrent('functions', () => {
  it('title mandatory to declare', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .describe('Add two numbers together.\nThis is a multiline description')
    expect(() => toTypescript(fn, { declaration: true })).toThrowError(UntitledDeclarationError)
  })

  it('function with multi-line description', async () => {
    const fn = z
      .function()
      .args(z.object({ a: z.number(), b: z.number() }))
      .returns(z.number())
      .title('add')
      .describe('Add two numbers together.\nThis is a multiline description')

    const typings = toTypescript(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      /**
       * Add two numbers together.
       * This is a multiline description
       */
      declare function add(arg0: { a: number; b: number }): number;
    `)

    expect(typings).toBeValidTypeScript()
  })

  it('function with no args and unknown return', async () => {
    const fn = z.function().title('fn')

    const typings = toTypescript(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare function fn(): unknown;')

    expect(typings).toBeValidTypeScript()
  })

  it('function with no args and void return', async () => {
    const fn = z.function().title('fn').returns(z.void())

    const typings = toTypescript(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare function fn(): void;')
    expect(typings).toBeValidTypeScript()
  })

  it('async function returning union', async () => {
    const fn = z
      .function()
      .title('fn')
      .returns(z.promise(z.union([z.number(), z.string()])))

    const typings = toTypescript(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare function fn(): Promise<number | string>;')
    expect(typings).toBeValidTypeScript()
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

    const typings = toTypescript(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare function fn(
        arg0: {
          a?: number;
          /** This is B parameter */
          b: string
        },
        /** This is a number */
        arg1: number,
        arg2: [string, /** This is a number */ number]
      ): unknown;
    `)
    expect(typings).toBeValidTypeScript()
  })

  it('function with optional args', async () => {
    const fn = z.function().title('fn').args(z.string().optional())
    const typings = toTypescript(fn, { declaration: true })
    expect(typings).toMatchWithoutFormatting('declare function fn(arg0?: string): unknown;')
    expect(typings).toBeValidTypeScript()
  })

  it('string literals', async () => {
    const typings = toTypescript(
      z.union([z.literal('Hello, world!'), z.literal('Yoyoyoyo')]).describe('yoyoyo\nmultiline'),
    )
    expect(typings).toMatchWithoutFormatting(`
      /**
       * yoyoyo
       * multiline
       */
      'Hello, world!' | 'Yoyoyoyo'
    `)
  })

  it('number literals', async () => {
    const code = toTypescript(z.literal(1))
    expect(code).toMatchWithoutFormatting('1')
  })

  it('boolean literals', async () => {
    const code = toTypescript(z.literal(true))
    expect(code).toMatchWithoutFormatting('true')
  })

  it('undefined literals', async () => {
    const typings = toTypescript(z.literal(undefined))
    expect(typings).toMatchWithoutFormatting('undefined')
  })

  it('null literals', async () => {
    const typings = toTypescript(z.literal(null))
    expect(typings).toMatchWithoutFormatting('null')
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
    expect(typings).toMatchWithoutFormatting(`{
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
    const typings = toTypescript(fn, { declaration: true })
    expect(typings).toMatchWithoutFormatting('declare function fn(firstName?: string): unknown;')
    expect(typings).toBeValidTypeScript()
  })

  it('mix of named and unnammed params', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().title('firstName').optional(), z.number(), z.object({ a: z.string() }).title('obj'))
    const typings = toTypescript(fn, { declaration: true })
    expect(typings).toMatchWithoutFormatting(`
      declare function fn(
        firstName?: string,
        arg1: number,
        obj: { a: string }
      ): unknown;
    `)
  })

  it('nullables and optionals combined', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().nullable().optional(), z.number().optional())
      .returns(z.string().nullable().optional())

    const typings = toTypescript(fn, { declaration: true })
    expect(typings).toMatchWithoutFormatting(`
      declare function fn(
        arg0?: string | null,
        arg1?: number
      ): string | null | undefined;
    `)
  })
})

describe('objects', () => {
  it('title mandatory to declare', async () => {
    const obj = z.object({ a: z.number(), b: z.string() })
    expect(() => toTypescript(obj, { declaration: true })).toThrowError()
  })

  it('normal object', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject')

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string };')
  })

  it('object with title and description', async () => {
    const obj = z
      .object({ a: z.number(), b: z.string() })
      .title('MyObject')
      .describe('This is my object.\nThis is a multiline description.\n\n\n')

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      /**
       * This is my object.
       * This is a multiline description.
       */
      declare const MyObject: { a: number; b: string };
    `)
  })

  it('nullable', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').nullable()

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string } | null;')
  })

  it('optionals with default values', async () => {
    const obj = z.object({ a: z.number(), b: z.string() }).title('MyObject').optional().default({ a: 1, b: 'hello' })

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare const MyObject: { a: number; b: string } | undefined;')
    expect(typings).toBeValidTypeScript()
  })

  it('enum', async () => {
    const obj = z.object({ a: z.enum(['hello', 'world']) }).title('MyObject')

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        a: 'hello' | 'world'
      };
    `)
    expect(typings).toBeValidTypeScript()
  })

  it('object with a description & optional', async () => {
    const obj = z
      .object({
        someStr: z.string().describe('Description').optional(),
      })
      .title('MyObject')

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        /** Description */
        someStr?: string
      };
    `)

    expect(typings).toBeValidTypeScript()
  })

  it('object with optional and a description (opposite of previous test)', async () => {
    const obj = z
      .object({
        someStr: z.string().optional().describe('Description'),
      })
      .title('MyObject')

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        /** Description */
        someStr?: string
      };
    `)
    expect(typings).toBeValidTypeScript()
  })

  it('object with nullable object and no properties', async () => {
    const obj = z
      .object({
        address: z.object({}).nullable(),
      })
      .title('MyObject')

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting('declare const MyObject: { address: {} | null };')
    expect(typings).toBeValidTypeScript()
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

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        /** This is a record */
        address: { [key: number]: { street: string; number: number } }
      };
    `)

    expect(typings).toBeValidTypeScript()
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

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(
      `
      declare const MyObject: {
        computed: { [key: string]: { status: string; error?: string } | undefined }
      };
    `,
    )
    expect(typings).toBeValidTypeScript()
  })

  it('Can handle a complex discriminated union with descriptions', () => {
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
    const typings = obj.toTypescript({ declaration: true })

    expect(typings).toBeValidTypeScript()
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

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        address: /** This is a record */ {
          [key: number]: { street: string; number: number }
        }
      };
    `)

    expect(typings).toBeValidTypeScript()
  })

  it('array of complex object as input params', async () => {
    const fn = z
      .function()
      .args(z.array(z.object({ a: z.number(), b: z.string() })))
      .title('MyObject')
    const typings = toTypescript(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting(
      'declare function MyObject(arg0: Array<{ a: number; b: string }>): unknown;',
    )
    expect(typings).toBeValidTypeScript()
  })

  it('array of primitives as input params', async () => {
    const fn = z.function().args(z.array(z.number()).describe('This is an array of numbers')).title('MyObject')
    const typings = toTypescript(fn, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare function MyObject(
        /** This is an array of numbers */
        arg0: number[]
      ): unknown;
    `)
    expect(typings).toBeValidTypeScript()
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

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        /** This is A */
        a: /*
         * This is A
         */
        string
      };
    `)

    expect(typings).toBeValidTypeScript()
  })

  it('zod effects', async () => {
    const obj = z
      .object({
        'Hello World!': z.string(),
        'Hey?': z.string().optional(),
        'Hey!': z.string().optional(),
      })
      .title('MyObject')

    const typings = toTypescript(obj, { declaration: true })

    expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        'Hello World!': string;
        'Hey?'?: string;
        'Hey!'?: string
      };
    `)

    expect(typings).toBeValidTypeScript()
  })
})

function getTypingVariations(type: z.ZodType, opts?: { declaration?: boolean; maxDepth?: number }): string[] {
  const baseTypings = toTypescript(type, opts)

  const typingsNullable = toTypescript(type.nullable(), opts)

  const typingsOptional = toTypescript(type.optional(), opts)

  const typingsNullableOptional = toTypescript(type.nullable().optional(), opts)

  const typingsOptionalNullable = toTypescript(type.optional().nullable(), opts)

  const output = [baseTypings, typingsNullable, typingsOptional, typingsNullableOptional, typingsOptionalNullable]

  return output
}

describe('primitives', () => {
  it.concurrent.each(getTypingVariations(z.string().title('MyString'), { declaration: true }))(
    'string',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.number().title('MyNumber'), { declaration: true }))(
    'number',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.bigint().title('MyBigInt'), { declaration: true }))(
    'int',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.boolean().title('MyBoolean'), { declaration: true }))(
    'boolean',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.date().title('MyDate'), { declaration: true }))(
    'date',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.undefined().title('MyUndefined'), { declaration: true }))(
    'undefined',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.null().title('MyNull'), { declaration: true }))('null', (typings) => {
    expect(typings).toBeValidTypeScript()
  })
  it.concurrent.each(getTypingVariations(z.unknown().title('MyUnknown'), { declaration: true }))(
    'unknown',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.never().title('MyNever'), { declaration: true }))(
    'never',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.nan().title('MyNaNBreadMiam'), { declaration: true }))(
    'nan',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.symbol().title('MySymbol'), { declaration: true }))(
    'symbol',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
  it.concurrent.each(getTypingVariations(z.literal('bob').title('MYLiteral'), { declaration: true }))(
    'function',
    (typings) => {
      expect(typings).toBeValidTypeScript()
    },
    5000,
  )
})
