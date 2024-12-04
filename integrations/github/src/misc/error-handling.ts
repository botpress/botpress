import { createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((originalError, customErrorMessage) => {
  // eslint-disable-next-line no-console
  console.log(customErrorMessage, originalError)
  return new sdk.RuntimeError(customErrorMessage)
})
