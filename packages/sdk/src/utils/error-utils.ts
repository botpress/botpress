/**
 * Utility to throw an error in ternary or nullish coalescing expressions
 */
export const throwError = (thrown: string | Error): never => {
  const error = thrown instanceof Error ? thrown : new Error(thrown)
  throw error
}
