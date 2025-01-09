import { createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((_originalError, customErrorMessage) => {
  return new sdk.RuntimeError(customErrorMessage)
})
