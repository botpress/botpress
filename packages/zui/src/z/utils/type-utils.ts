export type ValueOf<T> = T[keyof T]
export type IsEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2 ? true : false
export type IsAny<T> = 0 extends 1 & T ? true : false
export type NoUndefined<T> = T extends undefined ? never : T
export type Satisfies<X extends Y, Y> = X
export type SafeOmit<T, K extends keyof T> = Omit<T, K>
export type Primitive = string | number | bigint | boolean | symbol | null | undefined

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
