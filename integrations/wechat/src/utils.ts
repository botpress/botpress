import { RuntimeError } from '@botpress/sdk'
import { Result } from './types'

export const usePromiseToResult = (failMessage: string) => {
  return [
    <T>(data: T) => {
      return { success: true, data } satisfies Result<T>
    },
    (thrown: unknown) => {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      return { success: false, error: new RuntimeError(`${failMessage} -> ${error.message}`) } satisfies Result<void>
    },
  ] as const
}

export const useHandleCaughtError = (message: string) => {
  return (thrown: unknown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`${message} -> ${error.message}`)
  }
}
