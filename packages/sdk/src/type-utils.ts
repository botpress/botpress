import type z from './zui'

export type AnyZodObject = z.ZodObject<any>
export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
export type Cast<T, U> = T extends U ? T : U
export type Iof<T extends object> = { [K in keyof T]: T[K] }

export type Join<S extends (string | number | symbol)[]> = S extends [infer H, ...infer T]
  ? `${Cast<H, string>}${Join<Cast<T, string[]>>}`
  : S extends [infer H]
  ? Cast<H, string>
  : ''

export type Split<S extends string | number | symbol, D extends string> = S extends `${infer H}${D}${infer T}`
  ? [H, ...Split<Cast<T, string>, D>]
  : [S]

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export type ValueOf<T> = T[keyof T]

export type Writable<T> = { -readonly [K in keyof T]: T[K] }

export type Inspect<T> = { [K in keyof T]: T[K] }

export type KeyBy<T, Key extends keyof T> = {
  [TInstance in Cast<T[Key], string>]: Extract<T, { [K in Key]: TInstance }>
}

// tests

type IsEqual<T, U> = T extends U ? (U extends T ? true : false) : false
type Expect<T extends true> = T

type _test_keyby = Expect<
  IsEqual<
    KeyBy<
      | {
          name: 'circle'
        }
      | {
          name: 'square'
        }
      | {
          name: 'rectangle'
        },
      'name'
    >,
    {
      circle: {
        name: 'circle'
      }
      square: {
        name: 'square'
      }
      rectangle: {
        name: 'rectangle'
      }
    }
  >
>

type _test_join = Expect<IsEqual<Join<['a', 'b', 'c']>, 'abc'>>

type _test_split = Expect<IsEqual<Split<'a.b.c', '.'>, ['a', 'b', 'c']>>

type _test_union_to_intersection = Expect<
  IsEqual<
    UnionToIntersection<
      | {
          name: string
        }
      | {
          age: number
        }
    >,
    {
      name: string
      age: number
    }
  >
>
