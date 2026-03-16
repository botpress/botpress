export type Merge<A, B> = Omit<A, keyof B> & B

export type Result<T> = { success: true; data: T } | { success: false; error: Error }

/** A Result object with a potential status override when a failure occurs */
export type WebhookResult<T> = { success: true; data: T } | { success: false; error: Error; status?: number }
