export type Merge<A, B> = Omit<A, keyof B> & B
