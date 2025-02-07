export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
export type SafeOmit<T, K extends keyof T> = Omit<T, K>
export type Writable<T> = { -readonly [K in keyof T]: T[K] }

export type AssertNever<_T extends never> = true
export type AssertExtends<_A extends B, B> = true
export type AssertKeyOf<_K extends keyof T, T> = true
export type AssertTrue<_T extends true> = true
export type AssertAll<_T extends true[]> = true

export type IsExtend<X, Y> = X extends Y ? true : false
export type IsEquivalent<X, Y> = IsExtend<X, Y> extends true ? IsExtend<Y, X> : false
export type IsIdentical<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false
export type IsEqual<X, Y> = IsIdentical<Normalize<X>, Normalize<Y>>

type NormalizeObject<T extends object> = T extends infer O ? { [K in keyof O]: Normalize<O[K]> } : never
export type Normalize<T> = T extends (...args: infer A) => infer R
  ? (...args: Normalize<A>) => Normalize<R>
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
