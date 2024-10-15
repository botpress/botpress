import * as sdk from '@botpress/sdk'

/**
 * Wraps a function with a try-catch block that catches any errors and logs them
 * as a `sdk.RuntimeError`.
 *
 * @param fn - The function to wrap
 * @param errorMessage - The error message to log
 * @returns A function identical to the input function, but wrapped with a try-catch block
 */
export const wrapWithTryCatch = <T extends (...args: any[]) => Promise<any>>(fn: T, errorMessage: string): T => {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args)
    } catch (thrown: unknown) {
      console.error(errorMessage, thrown)
      throw new sdk.RuntimeError(errorMessage)
    }
  }) as T
}
