export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
export type SafeOmit<T, K extends keyof T> = Omit<T, K>
export type Writable<T> = { -readonly [K in keyof T]: T[K] }

export type AssertNever<_T extends never> = true
export type AssertExtends<_A extends B, B> = true
export type AssertKeyOf<_K extends keyof T, T> = true
export type AssertTrue<_T extends true> = true
