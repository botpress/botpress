import { createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)
