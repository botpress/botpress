import { describe, it, expect } from 'vitest'
import { toTypescriptType as toTs } from '.'
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

  it('function with literals', async () => {
    const fn = z
      .function()
      .args(z.literal('Hello, world!'))
      .returns(z.number())
      .title('greeting')
      .describe('Add two numbers together.\nThis is a multiline description')

    const typings = toTs(fn, { declaration: true })

    await expect(typings).toMatchWithoutFormatting(`
      /**
       * Add two numbers together.
       * This is a multiline description
       */
      declare function greeting(arg0: "Hello, world!"): number
    `)
  })

  it('type declaration works', async () => {
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
      declare function add(arg0: { a: number; b: number }): number;
    `)
  })

  it('function with no args and unknown return', async () => {
    const fn = z.function().title('fn')

    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting('declare function fn(): unknown;')
  })

  it('function with no args and void return', async () => {
    const fn = z.function().title('fn').returns(z.void())

    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting('declare function fn(): void;')
  })

  it('async function returning union', async () => {
    const fn = z
      .function()
      .title('fn')
      .returns(z.promise(z.union([z.number(), z.string()])))

    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting('declare function fn(): Promise<number | string>;')
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
  })

  it('function with optional args', async () => {
    const fn = z.function().title('fn').args(z.string().optional())
    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting('declare function fn(arg0?: string): unknown;')
  })

  it('function with readonly args', async () => {
    const fn = z.function().title('fn').args(z.string().readonly())
    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting('declare function fn(arg0: Readonly<string>): unknown;')
  })

  it('function with readonly enumerable args', async () => {
    const fn = z.function().title('fn').args(z.array(z.string()).readonly())
    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting('declare function fn(arg0: Readonly<string[]>): unknown;')
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
    const typings = toTypescript(z.literal(n))
    await expect(typings).toMatchWithoutFormatting('declare const x: 100n')
  })

  it('symbol literals', async () => {
    const n = Symbol('hello')
    const typings = toTypescript(z.literal(n))
    await expect(typings).toMatchWithoutFormatting('declare const x: symbol')
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
    await expect(typings).toMatchWithoutFormatting('declare function fn(firstName?: string): unknown;')
  })

  it('mix of named and unnammed params', async () => {
    const fn = z
      .function()
      .title('fn')
      .args(z.string().title('firstName').optional(), z.number(), z.object({ a: z.string() }).title('obj'))
    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting(`
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

    const typings = toTypescript(fn)
    await expect(typings).toMatchWithoutFormatting(`
      declare function fn(
        arg0?: string | null,
        arg1?: number
      ): string | null | undefined;
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
          }),
        ),
      })
      .title('MyObject')
      .describe('This is my object.\nThis is a multiline description.\n\n\n')

    const typings = toTs(obj, { declaration: true, includeClosingTags: true })

    await expect(typings).toMatchWithoutFormatting(`
      /**
       * This is my object.
       * This is a multiline description.
       */
      declare const MyObject: {
        a: number,
        b: string,
        c: (arg0: {
          /** This is d */
          d: string,
          /** The Knowledge Bases to Query */
          e: {
            /** This is f */
            f: boolean | undefined,
            /** This is g */
            g: "ga" | "gb",
            /** This is h */
            h: string[]
          }
        }) => unknown
      } // end of MyObject
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

  it('object with optional and a description', async () => {
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

  it('object with a description & readonly', async () => {
    const obj = z
      .object({
        someStr: z.string().describe('Description').readonly(),
      })
      .title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          /** Description */ someStr: Readonly<string>
        };
      `)
  })

  it('object with readonly and a description', async () => {
    const obj = z
      .object({
        someStr: z.string().readonly().describe('Description'),
      })
      .title('MyObject')

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
        declare const MyObject: {
          /** Description */
          someStr: Readonly<string>
        };
      `)
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

  it('can handle a complex discriminated union with descriptions', async () => {
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

    await expect(typings).toMatchWithoutFormatting(`
      declare const payment:
        | {
            type: 'Credit Card';
            /** This is the card number */
            cardNumber: string;
            /** This is the expiration date */
            expirationDate: string;
            /** This is the brand of the card */
            brand: 'Visa' | 'Mastercard' | 'American Express' | null | undefined;
          }
        | {
            type: 'PayPal';
            /** This is the paypal account's email address */
            email: string;
          }
        | {
            type: 'Bitcoin';
            /** This is the bitcoin address */
            address: string;
          }
        | {
            type: 'Bank Transfer';
            /** This is the bank account number */
            accountNumber: string;
          }
        | {
            type: 'Cash';
            /** This is the amount of cash */
            amount: number;
          }
    `)
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
          /** This is a record */ address: /** This is a record */ {
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
      'declare function MyObject(arg0: Array<{ a: number; b: string }>): unknown;',
    )
  })

  it('array of primitives as input params', async () => {
    const fn = z.function().args(z.array(z.number()).describe('This is an array of numbers')).title('MyObject')
    const typings = toTypescript(fn)

    await expect(typings).toMatchWithoutFormatting(`
        declare function MyObject(
          /** This is an array of numbers */
          arg0: number[]
        ): unknown;
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
          a: string
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

    const typings = toTypescript(obj)

    await expect(typings).toMatchWithoutFormatting(`
      declare const MyObject: {
        stringLiteral: "1";
        numberLiteral: 1;
        booleanLiteral: true;
        arrayLiteral: Array<"a">;
        tupleLiteral: ["a", 1];
        emptyTyple: [];
        nested: {    
          nestedLiteral: "nested"       
        };
      };
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

    const typings1 = toTypescript(fn1)
    const typings2 = toTypescript(fn2)
    const typings3 = toTypescript(fn3)

    await expect(typings1).toMatchWithoutFormatting(`declare function fn1(arg0: number | string): number | string`)
    await expect(typings2).toMatchWithoutFormatting(`declare function fn2(arg0: { id: number[] } | string): unknown`)
    await expect(typings3).toMatchWithoutFormatting(
      `declare function fn3(arg0: { id: number[] } | { name: string }): unknown`,
    )
  })

  it('records', async () => {
    const obj = z
      .object({
        Date: z.string().describe('Test\nHello').describe('Test2'),
        'Hello World!': z.string().optional(),
      })
      .required({ Date: true })

    const typings = toTypescript(obj)
    await expect(typings).toMatchWithoutFormatting(`
      declare const x: { 
      /** Test2 */
      Date: string
      ; 'Hello World!'?: string }
    `)
  })

  it('double optional', async () => {
    const obj = z
      .object({
        Date: z.optional(z.string().optional().optional()),
      })
      .required({ Date: false } as any)

    const typings = toTypescript(obj)
    await expect(typings).toMatchWithoutFormatting(`declare const x: { Date?: string }`)
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
            foo: string | undefined | null
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

describe.concurrent('closing tags', () => {
  it('should not include closing tags by default for large declarations', async () => {
    const largeSchema = z
      .object({
        prop1: z.string(),
        prop2: z.number(),
        prop3: z.boolean(),
        prop4: z.string(),
        prop5: z.number(),
        prop6: z.boolean(),
      })
      .title('LargeObject')

    const typings = toTs(largeSchema, { declaration: 'type' })

    expect(typings).not.toContain('// end of LargeObject')
  })

  it('should not include closing tags for small declarations even when includeClosingTags is enabled', async () => {
    const smallSchema = z
      .object({
        prop1: z.string(),
        prop2: z.number(),
      })
      .title('SmallObject')

    const typings = toTs(smallSchema, { declaration: 'type', includeClosingTags: true })

    expect(typings).not.toContain('// end of SmallObject')
  })

  it('should include closing tags for large function declarations when enabled', async () => {
    const largeFn = z
      .function()
      .describe('This is a large function with many parameters and a complex return type.')
      .args(
        z.object({
          param1: z.string().describe('This is the first parameter'),
          param2: z.number(),
          param3: z.boolean(),
          param4: z.string(),
          param5: z.number(),
        }),
      )
      .returns(
        z.object({
          result1: z.string(),
          result2: z.number(),
          result3: z.boolean(),
        }),
      )
      .title('LargeFunction')

    const typings = toTs(largeFn, { declaration: 'variable', includeClosingTags: true })

    expect(typings).toContain('// end of LargeFunction')
  })
})
