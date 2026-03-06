export type Merge<A, B> = Omit<A, keyof B> & B

export type Result<T> = { success: true; data: T } | { success: false; error: Error }
