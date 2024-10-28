export type ValueOf<T> = T[keyof T]
export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
export type Cast<T, U> = T extends U ? T : U
export type Writable<T> = { -readonly [K in keyof T]: T[K] }
export type Default<T, U> = undefined extends T ? U : T

export type IsExtend<T, U> = T extends U ? true : false
export type IsEqual<T, U> = T extends U ? (U extends T ? true : false) : false

export type AssertExtends<A, _B extends A> = true
export type AssertTrue<_T extends true> = true
export type AssertAll<_T extends true[]> = true

export type Join<S extends (string | number | symbol)[]> = S extends [infer H, ...infer T]
  ? `${Cast<H, string>}${Join<Cast<T, string[]>>}`
  : S extends [infer H]
  ? Cast<H, string>
  : ''

export type Split<S extends string | number | symbol, D extends string> = S extends `${infer H}${D}${infer T}`
  ? [H, ...Split<Cast<T, string>, D>]
  : [S]

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

/**
 * removes string index signature from Record
 */
export type ToSealedRecord<R extends Record<string, any>> = {
  [K in keyof R as string extends K ? never : K]: R[K]
}
