import { IAxiosRetryConfig } from 'axios-retry'

export type Headers = Record<string, string | string[]>

export type RetryConfig = IAxiosRetryConfig

export type CommonClientProps = {
  apiUrl?: string
  timeout?: number
  headers?: Headers
  retry?: RetryConfig
}

export type ClientConfig = {
  apiUrl: string
  headers: Headers
  withCredentials: boolean
  timeout: number
}

export type Cast<T, U> = T extends U ? T : U
export type AsyncFunc = (...args: any[]) => Promise<any>
export type Simplify<T> = T extends (...args: infer A) => infer R
  ? (...args: Simplify<A>) => Simplify<R>
  : T extends Promise<infer R>
    ? Promise<Simplify<R>>
    : T extends Buffer
      ? Buffer
      : T extends object
        ? T extends infer O
          ? { [K in keyof O]: Simplify<O[K]> }
          : never
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
