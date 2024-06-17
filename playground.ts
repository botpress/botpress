import { z } from './src'
import fs from 'node:fs'

const obj1 = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('Credit Card'),
      cardNumber: z
        .string()
        .title('Credit Card Number')
        .placeholder('1234 5678 9012 3456')
        .describe('This is the card number'),
      expirationDate: z.string().title('Expiration Date').placeholder('10/29').describe('This is the expiration date'),
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

const obj2 = z
  .array(
    z.object({
      data: z.templateLiteral().literal('bro ').interpolated(z.string()).literal('!'),
      name: z.string().optional().title('Name').placeholder('John Doe').describe('This is the name'),
      age: z.number().nullable().title('Age').placeholder('18').describe('This is the age'),
      email: z.string().email().title('Email').placeholder('The email').describe('This is the email'),
      aUnion: z.union([z.string(), z.number()]).title('A Union').placeholder('A Union').describe('This is a union'),
      aTuple: z.tuple([z.string(), z.number()]).title('A Tuple').placeholder('A Tuple').describe('This is a tuple'),
      aRecord: z.record(z.number()).title('A Record').placeholder('A Record').describe('This is a record'),
      anArray: z.array(z.number()).title('An Array').placeholder('An Array').describe('This is an array'),
      aSet: z.set(z.number()).title('A Set').placeholder('A Set').describe('This is a set'),
      aMap: z.map(z.string(), z.array(z.any())).title('A Map').placeholder('A Map').describe('This is a map'),
      aFunction: z
        .function()
        .args(z.array(z.union([z.literal('bob'), z.literal('steve')], z.string())).title('names'))
        .returns(z.literal('bro'))
        .title('A Function')
        .placeholder('A Function')
        .describe('This is a function'),
      aPromise: z.promise(z.number()).title('A Promise').placeholder('A Promise').describe('This is a promise'),
      aLazy: z
        .lazy(() => z.string())
        .title('A Lazy')
        .placeholder('A Lazy')
        .describe('This is a lazy'),
      aDate: z.date().title('A Date').placeholder('A Date').describe('This is a date'),
      aOptional: z.optional(z.string()).title('An Optional').placeholder('An Optional').describe('This is an optional'),
      aNullable: z.nullable(z.string()).title('A Nullable').placeholder('A Nullable').describe('This is a nullable'),
    }),
  )
  .title('users')

const obj3 = z
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

const typings = [
  obj1.toTypescript({ declaration: true }),
  obj2.toTypescript({ declaration: true }),
  obj3.toTypescript({ declaration: true }),
].join('\n\n')


fs.writeFileSync('./output.ts', typings)
