import * as sdk from '@botpress/sdk'

export const getErrorMessage = (thrown: unknown): string => (thrown instanceof Error ? thrown.message : String(thrown))

export const createFreshdeskRuntimeError = (thrown: unknown): sdk.RuntimeError =>
  new sdk.RuntimeError(getErrorMessage(thrown))
