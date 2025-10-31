import { isApiError } from '@botpress/client'

/**
 * Utility to throw an error in ternary or nullish coalescing expressions
 */
export const throwError = (thrown: string | Error): never => {
  const error = thrown instanceof Error ? thrown : new Error(thrown)
  throw error
}

/**
 * Wraps a promise and returns undefined if a 404 error is thrown
 */
export const notFoundErrorToUndefined = async <TRet>(promise: Promise<TRet>): Promise<TRet | undefined> => {
  try {
    return await promise
  } catch (thrown: unknown) {
    if (isApiError(thrown) && thrown.code === 404) {
      return undefined
    }
    throw thrown
  }
}
