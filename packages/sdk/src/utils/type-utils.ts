export type Function<I extends any[] = any, O extends any = any> = (...args: I) => O
export type ValueOf<T> = T[keyof T]
export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
export type Cast<T, U> = T extends U ? T : U
export type SafeCast<T, U> = [T] extends [never] ? U : Cast<T, U>
export type Writable<T> = { -readonly [K in keyof T]: T[K] }
export type Default<T, U> = undefined extends T ? U : T

export type Not<X extends boolean> = X extends true ? false : true
export type And<X extends boolean, Y extends boolean> = X extends true ? (Y extends true ? true : false) : false
export type Or<X extends boolean, Y extends boolean> = X extends true ? true : Y extends true ? true : false

export type AtLeastOne<T> = [T, ...T[]]
export type AtLeastOneProperty<T> = T extends undefined
  ? {}
  : {
      [K in keyof T]?: T[K]
    } & {
      [K in keyof T]: Pick<T, K>
    }[keyof T]
export type ExactlyOneProperty<T> = T extends undefined
  ? {}
  : {
      [K in keyof T]: { [P in K]: T[P] } & { [P in Exclude<keyof T, K>]?: never }
    }[keyof T]

export type IsExtend<X, Y> = X extends Y ? true : false
export type IsEquivalent<X, Y> = IsExtend<X, Y> extends true ? IsExtend<Y, X> : false
export type IsIdentical<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false
export type IsEqual<X, Y> = IsIdentical<Normalize<X>, Normalize<Y>>

/**
 * For F1 function to extend F2 function,
 * F2 input should extend F1 input so that if you call F1 thinking it is F2, it still works.
 * IsStricterFunction is not an extension check as it allows F1 to require a stricter input than F2.
 */
export type IsStricterFunction<F1 extends Function, F2 extends Function> = And<
  IsExtend<ReturnType<F1>, ReturnType<F2>>,
  IsExtend<Parameters<F1>, Parameters<F2>>
>

export type AssertExtends<_A extends B, B> = true
export type AssertNotExtends<A, B> = A extends B ? false : true
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

// Ensure tuples aren't collapsed into arrays
type NormalizeTuple<T> = T extends [...infer A] ? { [K in keyof A]: Normalize<A[K]> } : never
type NormalizeObject<T extends object> = T extends infer O ? { [K in keyof O]: Normalize<O[K]> } : never

export type Normalize<T> = T extends (...args: infer A) => infer R
  ? (...args: NormalizeTuple<A>) => Normalize<R>
  : T extends Array<infer E>
    ? Array<Normalize<E>>
    : T extends ReadonlyArray<infer E>
      ? ReadonlyArray<Normalize<E>>
      : T extends Promise<infer R>
        ? Promise<Normalize<R>>
        : T extends Buffer
          ? Buffer
          : T extends object
            ? NormalizeObject<T>
            : T

type DeepPartialObject<T extends object> = T extends infer O ? { [K in keyof O]?: DeepPartial<O[K]> } : never
export type DeepPartial<T> = T extends (...args: infer A) => infer R
  ? (...args: DeepPartial<A>) => DeepPartial<R>
  : T extends Array<infer E>
    ? Array<DeepPartial<E>>
    : T extends ReadonlyArray<infer E>
      ? ReadonlyArray<DeepPartial<E>>
      : T extends Promise<infer R>
        ? Promise<DeepPartial<R>>
        : T extends Buffer
          ? Buffer
          : T extends object
            ? DeepPartialObject<T>
            : T

export type SafeOmit<T, K extends keyof T> = Omit<T, K>

export type StringKeys<T> = Extract<keyof T, string>
