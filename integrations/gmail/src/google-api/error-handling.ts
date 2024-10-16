import { createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const wrapWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  console.log(customMessage, error)

  // since emails can be quite sensitive, by default we will not expose the
  // original error message to the user, instead replacing it with a generic
  // message if we're not given a RuntimeError
  return error instanceof sdk.RuntimeError ? error : new sdk.RuntimeError(customMessage)
})
