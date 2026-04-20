export type Merge<A, B> = Omit<A, keyof B> & B

export type Result<T, E extends Error = Error> = { success: true; data: T } | { success: false; error: E }
