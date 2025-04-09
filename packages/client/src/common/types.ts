import * as types from '../types'

export * from '../types'

export type CommonClientProps = {
  apiUrl?: string
  timeout?: number
  headers?: types.Headers
  retry?: types.RetryConfig
}

export type Cast<T, U> = T extends U ? T : U
export type AsyncFunc = (...args: any[]) => Promise<any>

type SimplifyTuple<T> = T extends [...infer A] ? { [K in keyof A]: Simplify<A[K]> } : never
type SimplifyObject<T extends object> = T extends infer O ? { [K in keyof O]: Simplify<O[K]> } : never
export type Simplify<T> = T extends (...args: infer A) => infer R
  ? (...args: SimplifyTuple<A>) => Simplify<R>
  : T extends Array<infer E>
    ? Array<Simplify<E>>
    : T extends ReadonlyArray<infer E>
      ? ReadonlyArray<Simplify<E>>
      : T extends Promise<infer R>
        ? Promise<Simplify<R>>
        : T extends Buffer
          ? Buffer
          : T extends object
            ? SimplifyObject<T>
            : T

export type Operation<C extends Record<string, AsyncFunc>> = Simplify<
  keyof {
    [K in keyof C as C[K] extends AsyncFunc ? K : never]: C[K]
  }
>

export type Inputs<C extends Record<string, AsyncFunc>> = Simplify<{
  [T in Operation<C>]: Parameters<C[Cast<T, keyof C>]>[0]
}>

export type Outputs<C extends Record<string, AsyncFunc>> = Simplify<{
  [T in Operation<C>]: Awaited<ReturnType<C[Cast<T, keyof C>]>>
}>
