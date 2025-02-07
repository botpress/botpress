import { createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  console.warn(customMessage, error)
  return new sdk.RuntimeError(`${customMessage}: ${error}`)
})
