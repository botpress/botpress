export type Result<T> = { success: true; data: T } | { success: false; error: Error }
