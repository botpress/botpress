import { createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((originalError, customErrorMessage) => {
  console.log(customErrorMessage, originalError)
  return new sdk.RuntimeError(customErrorMessage)
})
