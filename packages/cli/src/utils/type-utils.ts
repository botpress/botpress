export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
