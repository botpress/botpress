export type ValueOf<T> = T[keyof T]
export type NoUndefined<T> = T extends undefined ? never : T
export type Satisfies<X extends Y, Y> = X
export type SafeOmit<T, K extends keyof T> = Omit<T, K>
export type Cast<A, B> = A extends B ? A : B

export type Writeable<T> = {
  -readonly [P in keyof T]: T[P]
}

type _UnionToIntersectionFn<T> = (T extends unknown ? (k: () => T) => void : never) extends (
  k: infer Intersection
) => void
  ? Intersection
  : never

type _GetUnionLast<T> = _UnionToIntersectionFn<T> extends () => infer Last ? Last : never

export type UnionToTuple<T, Tuple extends unknown[] = []> = [T] extends [never]
  ? Tuple
  : UnionToTuple<Exclude<T, _GetUnionLast<T>>, [_GetUnionLast<T>, ...Tuple]>

type _OptionalKeys<T extends object> = {
  [k in keyof T]: undefined extends T[k] ? k : never
}[keyof T]

type _RequiredKeys<T extends object> = {
  [k in keyof T]: undefined extends T[k] ? never : k
}[keyof T]

export type AddQuestionMarks<
  T extends object,
  R extends keyof T = _RequiredKeys<T>,
  O extends keyof T = _OptionalKeys<T>,
> = Pick<T, R> & Partial<Pick<T, O>> & { [k in keyof T]?: unknown }

export type Identity<T> = T
export type Flatten<T> = Identity<{ [k in keyof T]: T[k] }>

type _NoNeverKeys<T> = {
  [k in keyof T]: [T[k]] extends [never] ? never : k
}[keyof T]

export type NoNever<T> = Identity<{
  [k in _NoNeverKeys<T>]: k extends keyof T ? T[k] : never
}>

// fast path when the key sets don't overlap: a plain intersection avoids the
// per-key remapping that deepens the instantiation tower on chained .extend()
export type ExtendShape<A, B> = Flatten<
  keyof A & keyof B extends never
    ? A & B
    : {
        [K in keyof A as K extends keyof B ? never : K]: A[K]
      } & {
        [K in keyof B]: B[K]
      }
>
