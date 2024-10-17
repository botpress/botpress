import * as sdk from '@botpress/sdk'

type RedactFn = (originalError: Error, customErrorMessage: string) => sdk.RuntimeError

/**
 * Creates a wrapper function for asynchronous functions that catches errors and
 * redacts them using a provided redactor function.
 *
 * @param redactorFn - A function that redacts the original error and returns a `sdk.RuntimeError`.
 * @returns A function that takes an asynchronous function and a custom error message, and returns a wrapped version of the asynchronous function.
 *
 * @example
 * ```typescript
 * const redactorFn = (originalError: Error, customErrorMessage: string) => {
 *   // ... Redact the error here ...
 *   return new sdk.RuntimeError(redactedErrorMessage)
 * }
 *
 * const asyncFunction = async () => {
 *   // Some async operation that might throw an error
 * }
 *
 * const tryCatchWrapper = createAsyncFnWrapperWithErrorRedaction(redactorFn)
 *
 * const wrappedAsyncFunction = tryCatchWrapper(asyncFunction, 'Custom error message')
 * ```
 */
export const createAsyncFnWrapperWithErrorRedaction =
  (redactorFn: RedactFn) =>
  /**
   * Wraps an async function with a try-catch block that catches any errors and
   * logs them as a `sdk.RuntimeError` after redacting them with a redactor
   * function to remove sensitive information.
   *
   * @param asyncFn - The function to wrap
   * @param errorCustomMessage - The error message to log
   * @returns A function identical to the input function, but wrapped with a try-catch block
   */
  <WrappedFn extends (...args: any[]) => Promise<any>>(asyncFn: WrappedFn, errorCustomMessage: string): WrappedFn => {
    return (async (...args: Parameters<WrappedFn>): Promise<Awaited<ReturnType<WrappedFn>>> => {
      try {
        return await asyncFn(...args)
      } catch (thrown: unknown) {
        const originalError = thrown instanceof Error ? thrown : new Error(`${thrown}`)
        const runtimeError = redactorFn(originalError, errorCustomMessage)
        throw runtimeError
      }
    }) as WrappedFn
  }

/**
 * Default error redactor that logs the original error to the integration logs
 * and returns a generic error message to the user.
 *
 * @param error - The original error
 * @param customMessage - The custom error message that is returned to the user
 * @returns a `sdk.RuntimeError` with the custom error message
 */
export const defaultErrorRedactor: RedactFn = (error: Error, customMessage: string) => {
  // By default, we log the original error to the integration logs with a call
  // to `console.warn` and return a generic error message to the user, because
  // we cannot trust the original error message to be safe to expose, as it may
  // contain sensitive information.

  console.warn(customMessage, error)
  return error instanceof sdk.RuntimeError ? error : new sdk.RuntimeError(customMessage)
}
