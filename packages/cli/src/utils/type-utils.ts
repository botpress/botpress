export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
export type SafeOmit<T, K extends keyof T> = Omit<T, K>
export type Writable<T> = { -readonly [K in keyof T]: T[K] }
