import { createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'

/*
  Since emails can be quite sensitive, by default we will not expose the
  original error message to the user, instead replacing it with a generic
  message if we're not given a RuntimeError. This is done by the default
  error redactor function.
*/
export const wrapWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)
